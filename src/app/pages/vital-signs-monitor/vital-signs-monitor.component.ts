import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { AuthService, User} from '../../User/services/auth.service';
import { Patient } from '../../models/patient.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-vital-signs-monitor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vital-signs-monitor.component.html',
  styleUrls: ['./vital-signs-monitor.component.css']
})
export class VitalSignsMonitorComponent implements OnInit, OnDestroy {
  patient: Patient | null = null;
  currentUser: User | null = null;
  loading = true;
  error = '';
  currentPatientId = 0;
  private updateSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (!user) {

        this.router.navigate(['/login']);
        return;
      }
    });


    this.route.params.subscribe(params => {
      this.currentPatientId = +params['id'];
      if (this.currentPatientId && this.currentUser) {
        this.loadPatient();
      } else if (!this.currentPatientId) {
        this.error = 'ID de paciente no válido';
        this.loading = false;
      }
    });


    this.startPeriodicUpdate();
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadPatient(): void {
    if (!this.currentUser || !this.currentPatientId) {
      this.error = 'Usuario no autenticado o ID de paciente inválido';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';


    this.patientService.getPatientById(this.currentPatientId).subscribe({
      next: (patient) => {
        // Verificar que el paciente pertenezca al usuario actual
        // Convertir ambos valores al mismo tipo para comparación
        if (String(patient.userId) !== String(this.currentUser!.id)) {
          this.error = 'No tienes acceso a este paciente';
          this.loading = false;
          return;
        }

        this.patient = patient;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los datos del paciente';
        this.loading = false;
        console.error(error);
      }
    });
  }

  startPeriodicUpdate(): void {
    // Actualizar cada 5 segundos
    this.updateSubscription = interval(5000).subscribe(() => {
      if (this.patient && !this.loading && this.currentUser) {
        this.loadPatient();
      }
    });
  }

  /**
   * Método para futuro uso con Samsung Health
   * Aquí procesarás los datos reales del dispositivo
   */
  processSamsungHealthData(healthData: any): void {
    if (!this.patient || !this.currentUser) return;


    if (String(this.patient.userId) !== String(this.currentUser.id)) {
      console.error('Sin permisos para actualizar este paciente');
      return;
    }


    if (healthData.heartRate) {
      this.patient.heartRate.current = healthData.heartRate;


      this.patient.heartRate.history.push(healthData.heartRate);
      if (this.patient.heartRate.history.length > 20) {
        this.patient.heartRate.history.shift();
      }


      this.updateHeartRateStatus(healthData.heartRate);
      this.updateRhythmFromHeartRate();

      // Enviar al servidor
      this.updatePatientOnServer();
    }
  }

  private updateHeartRateStatus(heartRate: number): void {
    if (!this.patient) return;

    if (heartRate < 60) {
      this.patient.heartRate.status = 'Bajo';
    } else if (heartRate > 100) {
      this.patient.heartRate.status = 'Alto';
    } else {
      this.patient.heartRate.status = 'Normal';
    }
  }

  private updateRhythmFromHeartRate(): void {
    if (!this.patient) return;

    const status = this.patient.heartRate.status.toLowerCase();

    switch (status) {
      case 'normal':
        this.patient.rhythm = 'Regular';
        break;
      case 'bajo':
        this.patient.rhythm = 'Bradicardia';
        break;
      case 'alto':
        this.patient.rhythm = 'Taquicardia';
        break;
      default:
        this.patient.rhythm = 'Irregular';
        break;
    }
  }

  private updatePatientOnServer(): void {
    if (!this.patient || !this.currentUser) return;



    if (String(this.patient.userId) !== String(this.currentUser.id)) {
      console.error('Sin permisos para actualizar este paciente');
      return;
    }


    this.patient.lastUpdated = new Date().toISOString();

    this.patientService.updatePatient(this.patient).subscribe({
      next: (updatedPatient) => {
        console.log('Paciente actualizado exitosamente');
      },
      error: (error) => {
        console.error('Error al actualizar paciente:', error);
      }
    });
  }

  getHeartRateColor(): string {
    if (!this.patient) return '#22c55e';

    const status = this.patient.heartRate.status.toLowerCase();
    switch (status) {
      case 'bajo': return '#ef4444';
      case 'alto': return '#f59e0b';
      default: return '#22c55e';
    }
  }

  getRhythmColor(): string {
    if (!this.patient) return '#333';

    const rhythm = this.patient.rhythm.toLowerCase();
    switch (rhythm) {
      case 'regular': return '#22c55e';
      case 'bradicardia': return '#ef4444';
      case 'taquicardia': return '#f59e0b';
      case 'irregular': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES');
  }

  getTimeLabels(): string[] {
    const now = new Date();
    const labels: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 30 * 1000)); // 30 segundos atrás
      labels.push(time.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }

    return labels;
  }

  generateWavePoints(): string {
    if (!this.patient || !this.patient.heartRate.history.length) return '';

    const history = this.patient.heartRate.history;
    const width = 300;
    const height = 80;
    const points: string[] = [];


    const recentHistory = history.slice(-20);

    recentHistory.forEach((value, index) => {
      const x = (index / (recentHistory.length - 1)) * width;
      const normalizedValue = ((value - 40) / 80) * height; // Normalizar 40-120 bpm
      const y = height - Math.max(0, Math.min(height, normalizedValue));
      points.push(`${x},${y}`);
    });

    return points.join(' ');
  }

  goBackToPatients(): void {
    this.router.navigate(['/pacientes']);
  }

  getUserInfo(): string {
    return this.currentUser ? `${this.currentUser.name} (${this.currentUser.email})` : '';
  }
}

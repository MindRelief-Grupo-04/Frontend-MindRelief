import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PatientService } from '../../services/patient.service';
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
  loading = true;
  error = '';
  currentPatientId = 1;
  private updateSubscription?: Subscription;

  constructor(
    private patientService: PatientService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener ID del paciente desde la ruta
    this.route.params.subscribe(params => {
      this.currentPatientId = +params['id'] || 1;
      this.loadPatient();
    });

    // Iniciar actualizaciones periódicas
    this.startPeriodicUpdate();
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  loadPatient(): void {
    this.loading = true;
    this.error = '';

    this.patientService.getPatient(this.currentPatientId).subscribe({
      next: (patient) => {
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
    // Actualizar cada 5 segundos (cuando uses Samsung Health, ajusta según necesites)
    this.updateSubscription = interval(5000).subscribe(() => {
      if (this.patient && !this.loading) {
        this.loadPatient(); // Recargar datos del servidor
      }
    });
  }

  /**
   * Método para futuro uso con Samsung Health
   * Aquí procesarás los datos reales del dispositivo
   */
  processSamsungHealthData(healthData: any): void {
    if (!this.patient) return;

    // Ejemplo de cómo procesarías los datos reales
    if (healthData.heartRate) {
      this.patient.heartRate.current = healthData.heartRate;

      // Actualizar historial
      this.patient.heartRate.history.push(healthData.heartRate);
      if (this.patient.heartRate.history.length > 20) {
        this.patient.heartRate.history.shift();
      }

      // Determinar estado y ritmo basado en datos reales
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
    if (!this.patient) return;

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

    // Usar los últimos 20 puntos para el gráfico
    const recentHistory = history.slice(-20);

    recentHistory.forEach((value, index) => {
      const x = (index / (recentHistory.length - 1)) * width;
      const normalizedValue = ((value - 40) / 80) * height; // Normalizar 40-120 bpm
      const y = height - Math.max(0, Math.min(height, normalizedValue));
      points.push(`${x},${y}`);
    });

    return points.join(' ');
  }
}

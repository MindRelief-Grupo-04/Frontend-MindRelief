import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../services/session.service';
import { Session } from '../../models/session.model';
import { AuthService } from '../../User/services/auth.service';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css']
})
export class SessionsComponent implements OnInit {
  patientId!: string;
  userId!: string;
  patientName: string = 'Paciente';
  sessions: Session[] = [];
  now: Date = new Date();
  todaySession: Session | null = null;
  latestSession: Session | null = null;

  newDate = '';
  newDescription = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.patientId = params.get('id') || '';
      this.userId = this.authService.getCurrentUserId();
      this.patientName = this.route.snapshot.queryParamMap.get('name') || 'Paciente';

      this.sessions = [];
      this.newDate = '';
      this.newDescription = '';
      this.todaySession = null;
      this.latestSession = null;

      // Actualizar la hora cada segundo
      setInterval(() => {
        this.now = this.getPeruCurrentTime();
      }, 1000);

      this.loadSessions();
    });
  }

  /**
   * Obtiene la hora actual de Perú usando la zona horaria correcta
   */
  getPeruCurrentTime(): Date {
    const now = new Date();
    const peruTimeString = now.toLocaleString('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return new Date(peruTimeString);
  }

  /**
   * Obtiene la fecha actual de Perú en formato YYYY-MM-DD
   */
  getPeruTodayString(): string {
    const now = new Date();
    return now.toLocaleDateString('en-CA', {
      timeZone: 'America/Lima'
    });
  }

  loadSessions(): void {
    this.sessionService.getSessionsByPatient(this.patientId, this.userId).subscribe(data => {
      // Ordenar por fecha ascendente
      this.sessions = data.sort((a, b) => a.date.localeCompare(b.date));

      // Obtener la fecha de hoy en Perú
      const todayPeru = this.getPeruTodayString();

      // Buscar sesión de hoy
      this.todaySession = this.sessions.find(s => s.date === todayPeru) || null;

      // Última sesión
      this.latestSession = this.sessions.length > 0 ? this.sessions[this.sessions.length - 1] : null;

      console.log('Sesiones:', this.sessions);
      console.log('Fecha actual en Perú:', todayPeru);
      console.log('Sesión de hoy:', this.todaySession);
    });
  }

  /**
   * Verifica si una fecha es hoy en hora de Perú
   */
  isToday(dateStr: string): boolean {
    const todayPeru = this.getPeruTodayString();
    return dateStr === todayPeru;
  }

  addSession(): void {
    if (this.newDate && this.newDescription) {
      // La fecha viene del input date, que ya está en formato YYYY-MM-DD
      // No necesitamos hacer conversiones adicionales
      const newSession: Omit<Session, 'id'> = {
        patientId: this.patientId,
        userId: this.userId,
        date: this.newDate, // Ya está en formato correcto
        description: this.newDescription
      };

      console.log('Agendando nueva sesión:', newSession);
      console.log('Fecha actual en Perú:', this.getPeruTodayString());
      console.log('¿Es hoy?', this.isToday(this.newDate));

      this.sessionService.createSession(newSession, this.userId).subscribe(() => {
        this.loadSessions();
        this.newDate = '';
        this.newDescription = '';
      });
    }
  }

  deleteSession(id: string): void {
    // Opcional: agregar confirmación
    const confirmed = confirm('¿Estás seguro de que quieres eliminar esta sesión? Se eliminarán también todos los datos de monitoreo asociados.');

    if (!confirmed) {
      return;
    }

    // Cambiar de deleteSession a deleteSessionComplete
    this.sessionService.deleteSessionComplete(id).subscribe({
      next: () => {
        this.loadSessions();
      },
      error: (error) => {
        console.error('Error al eliminar sesión:', error);
        alert('Error al eliminar la sesión. Por favor, inténtalo de nuevo.');
      }
    });
  }

  startMonitoring(session: Session): void {
    this.router.navigate([`/monitoring/${session.id}`]);
  }

  viewSession(session: Session): void {
    // Cambiar la navegación para ir a la pantalla de analytics
    this.router.navigate([`/session/${session.id}/analytics`]);
  }

  /**
   * Método auxiliar para formatear la fecha en español (Perú)
   */
  formatDateInSpanish(date: Date): string {
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Lima'
    });
  }

  /**
   * Método auxiliar para formatear la hora en español (Perú)
   */
  formatTimeInSpanish(date: Date): string {
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Lima'
    });
  }
}

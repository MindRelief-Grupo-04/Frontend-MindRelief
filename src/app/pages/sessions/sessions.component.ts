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

      setInterval(() => {
        this.now = this.getPeruCurrentTime();
      }, 1000);

      this.loadSessions();
    });
  }

  /**
   * Obtiene la hora actual de Perú (UTC-5)
   */
  getPeruCurrentTime(): Date {
    const now = new Date();
    // Perú está en UTC-5 (5 horas atrás de UTC)
    const peruTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    return peruTime;
  }

  /**
   * Obtiene la fecha actual de Perú en formato YYYY-MM-DD
   */
  getPeruTodayString(): string {
    const peruTime = this.getPeruCurrentTime();
    return peruTime.toISOString().split('T')[0];
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
    this.sessionService.deleteSession(id).subscribe(() => {
      this.loadSessions();
    });
  }

  startMonitoring(session: Session): void {
    this.router.navigate([`/monitoring/${session.id}`]);
  }

  viewSession(session: Session): void {
    this.router.navigate([`/session/${session.id}/details`]);
  }

  /**
   * Método auxiliar para formatear la fecha en español
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
   * Método auxiliar para formatear la hora en español
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

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

      this.loadSessions();
    });
  }

  loadSessions(): void {
    this.sessionService.getSessionsByPatient(this.patientId, this.userId).subscribe(data => {
      // Ordenar por fecha ascendente
      this.sessions = data.sort((a, b) => a.date.localeCompare(b.date));

      const today = new Date().toISOString().split('T')[0];

      // Encontrar sesión de hoy
      this.todaySession = this.sessions.find(s => s.date === today) || null;

      // Última sesión (la más reciente por fecha)
      this.latestSession = this.sessions.length > 0 ? this.sessions[this.sessions.length - 1] : null;
    });
  }

  addSession(): void {
    if (this.newDate && this.newDescription) {
      const newSession: Omit<Session, 'id'> = {
        patientId: this.patientId,
        userId: this.userId,
        date: this.newDate,
        description: this.newDescription
      };

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
}

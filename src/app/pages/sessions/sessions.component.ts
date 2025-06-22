import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Session {
  id: string;
  date: string;
  description: string;
}

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css']
})
export class SessionsComponent implements OnInit {
  patientId!: string;
  sessions: Session[] = [];

  newDate = '';
  newDescription = '';

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || '';
    this.loadSessions();
  }

  constructor(private route: ActivatedRoute) {}

  loadSessions(): void {
    // Simulación: luego conectar a un servicio backend
    this.sessions = [
      { id: '1', date: '2025-06-25', description: 'Primera exposición' },
      { id: '2', date: '2025-06-28', description: 'Sesión de seguimiento' }
    ];
  }

  addSession(): void {
    if (this.newDate && this.newDescription) {
      const newSession: Session = {
        id: crypto.randomUUID(),
        date: this.newDate,
        description: this.newDescription
      };
      this.sessions.push(newSession);
      this.newDate = '';
      this.newDescription = '';
    }
  }

  deleteSession(id: string): void {
    this.sessions = this.sessions.filter(session => session.id !== id);
  }
}

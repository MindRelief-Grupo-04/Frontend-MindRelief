import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Session } from '../models/session.model';
import { MonitoringService } from './monitoring.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:3000/sessions';

  constructor(
    private http: HttpClient,
    private monitoringService: MonitoringService
  ) {}

  getSessionsByPatient(patientId: string, userId: string): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}?patientId=${patientId}&userId=${userId}`);
  }

  createSession(session: Omit<Session, 'id'>, userId: string): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}?userId=${userId}`, session);
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Elimina una sesión junto con todos sus registros de monitoreo asociados
   */
  deleteSessionComplete(sessionId: string): Observable<void> {
    return this.monitoringService.getMonitoringRecordsBySession(sessionId).pipe(
      switchMap(monitoringRecords => {
        if (monitoringRecords.length === 0) {
          // No hay registros de monitoreo, eliminar solo la sesión
          return this.deleteSession(sessionId);
        } else {
          // Eliminar todos los registros de monitoreo primero
          const deleteObservables = monitoringRecords.map(record =>
            this.monitoringService.deleteMonitoringRecord(record.id!)
          );

          return forkJoin(deleteObservables).pipe(
            switchMap(() => this.deleteSession(sessionId))
          );
        }
      })
    );
  }

  getSession(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/${id}`);
  }
}

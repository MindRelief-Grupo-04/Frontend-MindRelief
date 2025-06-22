import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Session} from '../models/session.model';


@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:3000/sessions';

  constructor(private http: HttpClient) {}

  getSessionsByPatient(patientId: string, userId: string): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}?patientId=${patientId}&userId=${userId}`);
  }

  createSession(session: Omit<Session, 'id'>, userId: string): Observable<Session> {
    return this.http.post<Session>(`${this.apiUrl}?userId=${userId}`, session);
  }


  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSession(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/${id}`);
  }
}

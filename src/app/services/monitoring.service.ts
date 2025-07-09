import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HeartRate } from '../models/heartrate.model';

export interface MonitoringRecord {
  id?: string;
  sessionId: string;
  patientId: string;
  userId: string;
  startTime: number;
  endTime: number;
  startTimeLocal: number;
  endTimeLocal: number;
  duration: number; // en segundos
  totalRecords: number;
  records: HeartRate[];
  avgHeartRate?: number; // Promedio general de la sesión
  minHeartRate?: number; // Mínimo de la sesión
  maxHeartRate?: number; // Máximo de la sesión
  createdAt: string; // Fecha de creación ISO
}

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private apiUrl = 'http://localhost:3000/monitoringRecords';

  constructor(private http: HttpClient) {}

  /**
   * Guarda un registro completo de monitoreo
   */
  createMonitoringRecord(record: Omit<MonitoringRecord, 'id' | 'createdAt'>): Observable<MonitoringRecord> {
    const recordWithTimestamp = {
      ...record,
      createdAt: new Date().toISOString()
    };

    return this.http.post<MonitoringRecord>(this.apiUrl, recordWithTimestamp);
  }

  /**
   * Obtiene todos los registros de monitoreo para un paciente específico
   */
  getMonitoringRecordsByPatient(patientId: string, userId: string): Observable<MonitoringRecord[]> {
    return this.http.get<MonitoringRecord[]>(`${this.apiUrl}?patientId=${patientId}&userId=${userId}`);
  }

  /**
   * Obtiene todos los registros de monitoreo para una sesión específica
   */
  getMonitoringRecordsBySession(sessionId: string): Observable<MonitoringRecord[]> {
    return this.http.get<MonitoringRecord[]>(`${this.apiUrl}?sessionId=${sessionId}`);
  }

  /**
   * Obtiene un registro de monitoreo por ID
   */
  getMonitoringRecord(id: string): Observable<MonitoringRecord> {
    return this.http.get<MonitoringRecord>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene todos los registros de monitoreo para un usuario
   */
  getMonitoringRecordsByUser(userId: string): Observable<MonitoringRecord[]> {
    return this.http.get<MonitoringRecord[]>(`${this.apiUrl}?userId=${userId}`);
  }

  /**
   * Elimina un registro de monitoreo
   */
  deleteMonitoringRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza un registro de monitoreo
   */
  updateMonitoringRecord(record: MonitoringRecord): Observable<MonitoringRecord> {
    return this.http.put<MonitoringRecord>(`${this.apiUrl}/${record.id}`, record);
  }
}

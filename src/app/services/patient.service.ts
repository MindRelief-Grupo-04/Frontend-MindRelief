import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:3000/patients';

  constructor(private http: HttpClient) {}


  getPatientsByUser(userId: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}?userId=${userId}`);
  }


  getPatient(id: number, userId: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}?userId=${userId}`);
  }


  getPatientById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }


  updatePatient(patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${patient.id}`, patient);
  }


  createPatient(patient: Omit<Patient, 'id'>): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient);
  }


  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

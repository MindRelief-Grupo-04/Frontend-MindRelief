import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Patient } from './models/patient.model';
import { PatientService } from './services/patient.service';
import { PatientCardComponent } from './components/patient-card/patient-card.component';
import { AddPatientButtonComponent } from './components/add-patient-button/add-patient-button.component';

@Component({
  selector: 'app-patient-dashboard-main',
  standalone: true,
  imports: [CommonModule, PatientCardComponent, AddPatientButtonComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  patients: Patient[] = [];

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.patients = this.patientService.getPatients();
  }
}

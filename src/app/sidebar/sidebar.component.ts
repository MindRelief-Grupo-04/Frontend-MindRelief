import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../User/services/auth.service';
import { PatientService } from '../services/patient.service';
import { Patient } from '../models/patient.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isExpanded = true;
  patients: Patient[] = [];

  constructor(
    private authService: AuthService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUserValue?.id?.toString() || '';
    if (userId) {
      this.patientService.getPatientsByUser(userId).subscribe((patients) => {
        this.patients = patients;
      });
    }
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}

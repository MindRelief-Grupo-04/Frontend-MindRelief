import { Component, OnInit } from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
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
    private patientService: PatientService,
    private router: Router,

  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.patientService.getPatientsByUser(userId.toString()).subscribe(p => {
        this.patients = p;

      });
    }
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  cerrarSesion(): void {
    this.authService.logout();

  }
  goToSessions(patientId: string, name: string) {
    this.router.navigate(['/paciente', patientId, 'sesiones'], {
      queryParams: { name }
    });
  }

}

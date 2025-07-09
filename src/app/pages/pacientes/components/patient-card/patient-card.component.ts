import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Patient } from '../../../../models/patient.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-card.component.html',
  styleUrls: ['./patient-card.component.css']
})
export class PatientCardComponent {
  @Input() patient!: Patient;

  showOptions = false;

  constructor(private router: Router) {}

  toggleOptions(): void {
    this.showOptions = !this.showOptions;
  }

  goToSessions(): void {
    this.router.navigate(['/paciente', this.patient.id, 'sesiones'], {
      queryParams: { name: this.patient.name }
    });
  }
}

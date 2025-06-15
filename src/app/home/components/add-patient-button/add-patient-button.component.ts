import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-patient-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-patient-button.component.html',
  styleUrls: ['./add-patient-button.component.css']
})
export class AddPatientButtonComponent {
  showForm = false;

  toggleForm(): void {
    this.showForm = !this.showForm;
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../../../models/patient.model';
import { PatientService } from '../../../../services/patient.service';
import { AuthService} from '../../../../User/services/auth.service';

@Component({
  selector: 'app-add-patient-button',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-patient-button.component.html',
  styleUrls: ['./add-patient-button.component.css']
})
export class AddPatientButtonComponent {
  showForm = false;

  name = '';
  age: number | null = null;
  gender = 'Femenino';


  @Output() patientAdded = new EventEmitter<void>();

  constructor(
    private patientService: PatientService,
    private authService: AuthService
  ) {}

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  submitForm(): void {
   const userId = this.authService.getCurrentUserId();

    const newPatient: Omit<Patient, 'id'> = {
      userId,
      name: this.name,
      age: this.age || 0,
      gender: this.gender
     };

    this.patientService.createPatient(newPatient).subscribe(() => {
      this.toggleForm();
      this.patientAdded.emit(); // notifica al componente padre
      this.resetForm();
    });
  }

  resetForm(): void {
    this.name = '';
    this.age = null;
    this.gender = 'Femenino'
  }
}

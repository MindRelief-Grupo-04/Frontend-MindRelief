import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Patient } from '../../../../models/patient.model';
import { PatientService } from '../../../../services/patient.service';
import { AuthService } from '../../../../User/services/auth.service';

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
    private authService: AuthService,
    private http: HttpClient
  ) {}

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  submitForm(): void {
    const userId = this.authService.getCurrentUserId();
    const randomId = Math.floor(Math.random() * 898) + 1; // 1 to 898

    this.http.get<any>(`https://pokeapi.co/api/v2/pokemon/${randomId}`).subscribe({
      next: (pokemonData) => {
        const imageUrl = pokemonData.sprites.front_default || '';

        const newPatient: Omit<Patient, 'id'> = {
          userId,
          name: this.name,
          age: this.age || 0,
          gender: this.gender,
          imageUrl
        };

        this.patientService.createPatient(newPatient).subscribe(() => {
          this.toggleForm();
          this.patientAdded.emit();
          this.resetForm();
        });
      },
      error: (err) => {
        console.error('Error al obtener el Pokémon:', err);
        alert('No se pudo obtener la imagen del Pokémon. Intenta nuevamente.');
      }
    });
  }

  resetForm(): void {
    this.name = '';
    this.age = null;
    this.gender = 'Femenino';
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Patient} from '../../../../models/patient.model';

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
  showDetails = false;

  toggleOptions() {
    this.showOptions = !this.showOptions;
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }
}

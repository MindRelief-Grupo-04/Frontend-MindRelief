import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../User/services/auth.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  editedUser = {
    name: '',
    email: ''
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.currentUserValue;
    if (this.user) {
      this.editedUser = {
        name: this.user.name,
        email: this.user.email
      };
    }
  }

  startEditing() {
    this.isEditing = true;
  }

  saveChanges() {
    if (this.user && this.editedUser.name && this.editedUser.email) {
      const updatedUser = {
        ...this.user,
        name: this.editedUser.name,
        email: this.editedUser.email
      };

      this.authService.updateUserProfile(updatedUser).subscribe({
        next: (user) => {
          this.user = user;
          this.isEditing = false;
        },
        error: (error) => {
          console.error('Error al actualizar el perfil:', error);
        }
      });
    }
  }

  cancelEditing() {
    if (this.user) {
      this.editedUser = {
        name: this.user.name,
        email: this.user.email
      };
    }
    this.isEditing = false;
  }
}

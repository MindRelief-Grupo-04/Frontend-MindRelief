import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthService } from './User/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  template: `
    <div class="app-container">
      <app-sidebar *ngIf="authService.isAuthenticated() && !isAuthRoute()"></app-sidebar>
      <main [class.main-content]="authService.isAuthenticated() && !isAuthRoute()"
            [class.full-width]="!authService.isAuthenticated() || isAuthRoute()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
    }
    .main-content {
      flex: 1;
      margin-left: 250px;
      transition: margin-left 0.3s ease;
    }
    .full-width {
      flex: 1;
      margin-left: 0;
    }
  `]
})
export class AppComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  isAuthRoute(): boolean {
    const currentRoute = this.router.url;
    return currentRoute.includes('/login') || currentRoute.includes('/register');
  }
}

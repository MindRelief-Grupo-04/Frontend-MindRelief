import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated && !state.url.includes('/login')) {
    router.navigate(['/login']);
    return false;
  }

  if (isAuthenticated && (state.url === '/login' || state.url === '/register')) {
    router.navigate(['/inicio']);
    return false;
  }

  return true;
};

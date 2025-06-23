import { Routes } from '@angular/router';
import { AuthGuard } from './User/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./User/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./User/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'inicio',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/inicio/inicio.component').then(m => m.InicioComponent)
  },
  {
    path: 'agenda',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/agenda/agenda.component').then(m => m.AgendaComponent)
  },
  {
    path: 'pacientes',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/pacientes/components/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent)
  },
  {
    path: 'configuracion',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
  },
  {
    path: 'paciente/:id/sesiones',
    loadComponent: () => import('./pages/sessions/sessions.component').then(m => m.SessionsComponent)
  },

  {
    path: 'monitoring/:sessionId',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/realtime/realtime.component').then(m => m.RealtimeComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

import { Routes } from '@angular/router';
import {PatientDashboardComponent} from './pages/pacientes/patient-dashboard.component';

export const routes: Routes = [
  { path: 'inicio', loadComponent: () => import('./pages/inicio/inicio.component').then(c => c.InicioComponent) },
  { path: 'agenda', loadComponent: () => import('./pages/agenda/agenda.component').then(c => c.AgendaComponent) },
  { path: 'pacientes', loadComponent: () => import('./pages/pacientes/patient-dashboard.component').then(c => c.PatientDashboardComponent) },
  { path: 'configuracion', loadComponent: () => import('./pages/configuracion/configuracion.component').then(c => c.ConfiguracionComponent) },
  { path: '', redirectTo: '/inicio', pathMatch: 'full' }
];

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'inicio', loadComponent: () => import('./pages/inicio/inicio.component').then(c => c.InicioComponent) },
  { path: 'agenda', loadComponent: () => import('./pages/agenda/agenda.component').then(c => c.AgendaComponent) },
  { path: 'pacientes', loadComponent: () => import('./pages/pacientes/pacientes.component').then(c => c.PacientesComponent) },
  { path: 'configuracion', loadComponent: () => import('./pages/configuracion/configuracion.component').then(c => c.ConfiguracionComponent) },
  { path: '', redirectTo: '/inicio', pathMatch: 'full' }
];

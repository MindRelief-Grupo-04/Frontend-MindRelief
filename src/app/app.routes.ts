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
 // {
   // path: 'monitoring/:id',
   // canActivate: [AuthGuard],
   // loadComponent: () => import('./pages/vital-signs-monitor/vital-signs-monitor.component').then(m => m.VitalSignsMonitorComponent)
  //},
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

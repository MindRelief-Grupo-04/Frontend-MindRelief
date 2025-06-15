import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HomeMainComponent } from './home/pages/home-main/home-main.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      {
        path: '',
        component: HomeMainComponent
      }
    ])
  ]
};

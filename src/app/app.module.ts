import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AppComponent } from './app.component';
import { AgendaComponent } from './pages/agenda/agenda.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    FullCalendarModule,
    AgendaComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

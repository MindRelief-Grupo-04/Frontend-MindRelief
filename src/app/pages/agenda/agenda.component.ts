import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../User/services/auth.service';
import { Event } from '../../interfaces/event.interface';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css'
})
export class AgendaComponent implements OnInit {
  events: Event[] = [];
  userId: string;

  constructor(
    private eventService: EventService,
    private authService: AuthService
  ) {
    this.userId = this.authService.getCurrentUserId();
  }

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    locale: 'es',
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    events: [] // Se actualizará en ngOnInit
  };

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getEventsByUser(this.userId).subscribe(
      (events) => {
        this.events = events;
        this.calendarOptions.events = events;
      }
    );
  }

  handleDateSelect(selectInfo: any) {
    const title = prompt('Por favor ingrese un título para el evento:');
    if (title) {
      const newEvent = {
        userId: this.userId,
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        description: '',
        color: '#4285f4'
      };

      this.eventService.createEvent(newEvent).subscribe(
        (createdEvent) => {
          this.loadEvents(); // Recargar eventos
        }
      );
    }
    selectInfo.view.calendar.unselect();
  }

  handleEventClick(clickInfo: any) {
    if (confirm(`¿Estás seguro de que quieres eliminar el evento '${clickInfo.event.title}'?`)) {
      this.eventService.deleteEvent(clickInfo.event.id).subscribe(
        () => {
          this.loadEvents(); // Recargar eventos
        }
      );
    }
  }
}

import { Injectable } from '@angular/core';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private patients: Patient[] = [
    {
      id: 1,
      name: 'Gabriel',
      age: 36,
      lastSession: 3,
      imageUrl: 'https://media.istockphoto.com/id/155150766/es/foto/jet-avi%C3%B3n-de-pasajeros-volando-sobre-nubes.jpg?s=612x612&w=0&k=20&c=32sEubJHIH1faUJ8ztLmcfqCrYymAwPidWLkNVj6eOc='
    },
    {
      id: 2,
      name: 'Rafael',
      age: 17,
      lastSession: 2,
      imageUrl: 'https://i0.wp.com/luismiguelreal.blog/wp-content/uploads/2022/10/jake-ingle-s-t1oJXKYI4-unsplash.jpg?fit=5184%2C3456&ssl=1'
    },
    {
      id: 3,
      name: 'Dana',
      age: 23,
      lastSession: 1,
      imageUrl: 'https://awenpsicologia.com/wp-content/uploads/miedo-a-las-alturas.jpg'
    },
    {
      id: 4,
      name: 'Nadia',
      age: 15,
      lastSession: 4,
      imageUrl: 'https://images.ecestaticos.com/8r2HOXftikULPbWSuhkMgbOGT74=/0x0:1229x853/1200x900/filters:fill(white):format(jpg)/f.elconfidencial.com%2Foriginal%2F027%2F916%2F475%2F027916475020a781aa705d9d4148ffc7.jpg'
    }
  ];

  constructor() { }

  getPatients(): Patient[] {
    return this.patients;
  }
}

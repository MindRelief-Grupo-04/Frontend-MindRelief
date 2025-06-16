import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject = new BehaviorSubject<User | null>(user);
      } catch {
        localStorage.removeItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<User | null>(null);
      }
    } else {
      this.currentUserSubject = new BehaviorSubject<User | null>(null);
    }
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<User> {
    return this.http.get<User[]>(`${this.apiUrl}/users?email=${email}&password=${password}`)
      .pipe(
        map(users => {
          const user = users[0];
          if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
            return user;
          }
          throw new Error('Credenciales inválidas');
        })
      );
  }

  register(userData: { name: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, userData);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUserValue !== null && localStorage.getItem('currentUser') !== null;
  }

  getCurrentUserId(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || '';
  }
  updateUserProfile(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${user.id}`, user).pipe(
      map(updatedUser => {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        return updatedUser;
      })
    );
  }
}

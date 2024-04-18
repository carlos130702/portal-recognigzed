import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface User {
  id: number;
  Usuario: string;
  password: string;
  Nombre?: string;
  Apellidos?: string;
  Foto?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000';
  private currentUser: User | null = null;

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<User | null> {
    return this.http.get<User[]>(`${this.apiUrl}/administradores`).pipe(
      map(admins => {
        const admin = admins.find(a => a.Usuario === username && a.password === password);
        if (admin) {
          const userToStore = { ...admin, role: 'administrador' };
          sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
          return userToStore;
        }
        throw new Error('Not admin');
      }),
      catchError(err =>
        err.message === 'Not admin' ? this.http.get<User[]>(`${this.apiUrl}/trabajadores`).pipe(
          map(workers => {
            const worker = workers.find(w => w.Usuario === username && w.password === password);
            if (worker) {
              const userToStore = { ...worker, role: 'trabajador' };
              sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
              return userToStore;
            }
            return null;
          })
        ) : of(null)
      )
    );
  }
  isAuthenticated(): boolean {
    const currentUser = sessionStorage.getItem('currentUser');
    return !!currentUser;
  }

  getCurrentUser(): User | null {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
  }
}

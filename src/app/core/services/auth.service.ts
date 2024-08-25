import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of, switchMap, take} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {AngularFirestore} from "@angular/fire/compat/firestore";

export interface User {
  id: string;
  user: string;
  password: string;
  name?: string;
  lastName?: string;
  photo?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;

  constructor(private firestore: AngularFirestore) { }

  login(username: string, password: string): Observable<User | null> {
    return this.firestore.collection<User>('administradores', ref => ref.where('user', '==', username).where('password', '==', password))
      .valueChanges({ idField: 'id' })
      .pipe(
        take(1),
        switchMap(admins => {
          const admin = admins[0];
          if (admin) {
            const userToStore = { ...admin, role: 'administrador' };
            sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
            return of(userToStore);
          }
          return this.firestore.collection<User>('trabajadores', ref => ref.where('user', '==', username).where('password', '==', password))
            .valueChanges({ idField: 'id' })
            .pipe(
              take(1),
              map(workers => {
                const worker = workers[0];
                if (worker) {
                  const userToStore = { ...worker, role: 'trabajador' };
                  sessionStorage.setItem('currentUser', JSON.stringify(userToStore));
                  return userToStore;
                }
                return null;
              })
            );
        })
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

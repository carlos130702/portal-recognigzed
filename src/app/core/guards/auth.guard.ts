import {Injectable} from '@angular/core';
import {
  Router,
  CanActivateFn
} from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import {Observable} from "rxjs";


@Injectable({
  providedIn: 'root'
})

export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser && (currentUser.role === 'administrador' || currentUser.role === 'trabajador')) {
      return true;
    } else if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']).catch(err => {
        console.error('Error during navigation to /login:', err);
      });
      return false;
    } else {
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}

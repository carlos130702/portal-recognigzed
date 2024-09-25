import { Component } from '@angular/core';
import {AuthService, User} from "../core/services/auth.service";
import {Router} from "@angular/router";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  user: string = '';
  password: string = '';
  mostrar: boolean = false;
  usernameFocused: boolean = false;
  passwordFocused: boolean = false;
  isLoading: boolean = false;
  failedAttempts: number = 0;
  maxAttempts: number = 3;
  lockTime: number = 60000;
  lockTimeout: any;
  isLocked: boolean = false;

  constructor(private authService: AuthService, private router: Router,private messageService: MessageService,) { }

  onSubmit(): void {
    if (this.isLoading || this.isLocked) {
      return;
    }
    this.isLoading = true;

    this.authService.login(this.user, this.password).subscribe((user: User | null) => {
      this.isLoading = false;

      if (!user) {
        this.failedAttempts++;

        if (this.failedAttempts >= this.maxAttempts) {
          this.isLocked = true;
          this.messageService.add({
            severity: 'error',
            summary: 'Bloqueado',
            detail: 'Has alcanzado el número máximo de intentos. El login está bloqueado por 1 minutos.'
          });
          this.lockTimeout = setTimeout(() => {
            this.isLocked = false;
            this.failedAttempts = 0;
            this.messageService.add({
              severity: 'info',
              summary: 'Desbloqueado',
              detail: 'El login ha sido desbloqueado. Puedes intentar nuevamente.'
            });
          }, this.lockTime);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Contraseña incorrecta o usuario no encontrado. Intento ${this.failedAttempts} de ${this.maxAttempts}.`
          });
        }
        return;
      }
      this.failedAttempts = 0;
      clearTimeout(this.lockTimeout);
      this.isLocked = false;

      const redirectPath = user.role === 'administrador' ? '/admin' : '/worker';
      const redirectMessage = user.role === 'administrador' ?
        'Redirigiendo a la vista de administrador.' : 'Redirigiendo a la vista de trabajador.';

      this.messageService.add({
        severity: 'success',
        summary: 'Credenciales Correctas',
        detail: redirectMessage
      });

      setTimeout(() => {
        this.router.navigate([redirectPath]).then(r => console.log(`Redirección a ${redirectPath}:`, r));
      }, 1000);
    });
  }

  toggleMostrar() {
    this.mostrar = !this.mostrar;
  }
}

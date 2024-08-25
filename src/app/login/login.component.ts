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

  constructor(private authService: AuthService, private router: Router,private messageService: MessageService,) { }

  onSubmit(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.authService.login(this.user, this.password).subscribe((user: User | null) => {
      this.isLoading = false;

      if (!user) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Contraseña incorrecta o usuario no encontrado.'
        });
        return;
      }

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

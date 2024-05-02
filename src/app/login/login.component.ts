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
  constructor(private authService: AuthService, private router: Router,private messageService: MessageService,) { }

  onSubmit(): void {
    console.log('Intentando iniciar sesión con:', this.user);
    this.authService.login(this.user, this.password).subscribe((user: User | null) => {
      console.log('Respuesta de login:', user);
      if (user && user.role === 'administrador') {
        this.messageService.add({
          severity: 'success',
          summary: 'Credenciales Correctas',
          detail: 'Redirigiendo a la vista de administrador.'
        });
        setTimeout(() => {
          this.router.navigate(['/admin']).then(r => console.log('Redirección a admin:', r));
        }, 1000);
      } else if (user && user.role === 'trabajador') {
        this.messageService.add({
          severity: 'success',
          summary: 'Credenciales Correctas',
          detail: 'Redirigiendo a la vista de trabajador.'
        });
        setTimeout(() => {
          this.router.navigate(['/worker']).then(r => console.log('Redirección a worker:', r));
        }, 1000);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Contraseña incorrectas o usuario no encontrado.'
        });
      }
    });
  }
  toggleMostrar() {
    this.mostrar = !this.mostrar;
  }
}

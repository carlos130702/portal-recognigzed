import { Component } from '@angular/core';
import {AuthService, User} from "../core/services/auth.service";
import {Router} from "@angular/router";

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
  constructor(private authService: AuthService, private router: Router) { }

  onSubmit(): void {
    console.log('Intentando iniciar sesión con:', this.user);
    this.authService.login(this.user, this.password).subscribe((user: User | null) => {
      console.log('Respuesta de login:', user);
      if (user && user.role === 'administrador') {
        console.log('Navegando a admin');
        this.router.navigate(['/admin']).then(r => console.log('Redirección a admin:', r));
      } else if (user && user.role === 'trabajador') {
        console.log('Navegando a trabajador');
        this.router.navigate(['/worker']).then(r => console.log('Redirección a worker:', r));
      } else {
        console.log('Credenciales incorrectas o usuario no encontrado');
        alert('Credenciales incorrectas o usuario no encontrado.');
      }
    });
  }
  toggleMostrar() {
    this.mostrar = !this.mostrar;
  }
}

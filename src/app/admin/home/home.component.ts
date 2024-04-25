import {Component, ViewEncapsulation} from '@angular/core';
import {MenuItem} from "primeng/api";
import {AuthService} from "../../core/services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  encapsulation: ViewEncapsulation.None, // Esto desactivará el encapsulamiento
})
export class HomeComponent {
  items: MenuItem[];

  constructor(private authService: AuthService,private router: Router) {
    this.items = [
      {
        label: 'Listado de Trabajadores',
        routerLink: ['/admin/trabajadores'],
        routerLinkActiveOptions : {exact: true}
      },
      {
        label: 'Exámenes Registrados',
        routerLink: ['/admin/examenes-registrados'],
        routerLinkActiveOptions : {exact: true}
      }
    ];
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(r => {
      console.clear();
      console.log('Redirección a login:', r);
      console.log('Usuario ha cerrado sesión correctamente.');
    });
  }

}

import {Component, ViewEncapsulation} from '@angular/core';
import {MenuItem} from "primeng/api";
import {AuthService} from "../../core/services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent {
  items: MenuItem[];

  constructor(private authService: AuthService,private router: Router) {
    this.items = [
      {
        label: 'Listado de Trabajadores',
        routerLink: ['/admin/trabajadores'],
      },
      {
        label: 'Registro de Trabajadores',
        routerLink: ['/admin/registro-trabajador'],
      },
      {
        label: 'Registro de Exámenes',
        routerLink: ['/admin/registro-examen'],
      }
    ];
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(r => console.log('Redirección a login:', r));

  }
}

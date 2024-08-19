import {Component, ViewEncapsulation} from '@angular/core';
import {ConfirmationService, MenuItem} from "primeng/api";
import {AuthService} from "../../core/services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  encapsulation: ViewEncapsulation.None,
  providers: [ConfirmationService]
})
export class HomeComponent {
  items: MenuItem[];

  constructor(
    private authService: AuthService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    this.items = [
      {
        label: 'Listado de Trabajadores',
        routerLink: ['/admin/trabajadores'],
        routerLinkActiveOptions: { exact: true },
        routerLinkActive: 'active-menu-item'
      },
      {
        label: 'Exámenes Registrados',
        routerLink: ['/admin/examenes-registrados'],
        routerLinkActiveOptions: { exact: true },
        routerLinkActive: 'active-menu-item'
      }
    ];
  }

  logout() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres cerrar sesión?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authService.logout();
        this.router.navigate(['/login']).then(r => {
          console.clear();
          console.log('Redirección a login:', r);
          console.log('Usuario ha cerrado sesión correctamente.');
        });
      }
    });
  }
}

import {ChangeDetectorRef, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ConfirmationService, MenuItem} from "primeng/api";
import {AuthService} from "../../core/services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
  items: MenuItem[];
  userName: string = '';

  constructor( private confirmationService: ConfirmationService,private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.items = [
      {
        label: 'Examenes Disponibles',
        routerLink: ['/worker/examenes'],
        routerLinkActiveOptions: {exact: true}
      }
    ];
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userName = `${currentUser.name} ${currentUser.lastName}`;
      this.cdr.detectChanges();
    }
  }

  logout() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres cerrar sesión?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      defaultFocus: 'reject',
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

import { Component } from '@angular/core';
import {MenuItem} from "primeng/api";
import {AuthService} from "../../core/services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  items: MenuItem[];

  constructor(private authService: AuthService,private router: Router) {
    this.items = [
      {
        label: 'Examenes',
        routerLink: ['/worker/examenes'],
      }
    ];
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(r => console.log('Redirección a login:', r));

  }
}

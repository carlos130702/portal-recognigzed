import { inject } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';
import { AuthService } from '../services/auth.service';

import { map } from 'rxjs';
import {MatSnackBar} from "@angular/material/snack-bar";
import Swal from "sweetalert2";

export const routerInjection = () => inject(Router);
export const authStateObs$ = () => inject(AuthService).authState$;

export const authGuard: CanActivateFn = () => {
  const router = routerInjection();

  return authStateObs$().pipe(
    map((user) => {
      if (!user) {
        router.navigateByUrl('/').then(r =>
          console.log(r)
        );
        return false;
      }
      return true;
    })
  );
};

export const publicGuard: CanActivateFn = () => {
  const router = routerInjection();

  return authStateObs$().pipe(
    map((user) => {
      if (user) {
        router.navigateByUrl('/home').then(r =>
          console.log(r));
        return false;
      }
      return true;
    })
  );
};
export const roleBasedGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return authService.authState$.pipe(
    map(user => {
      if (!user) {
        router.navigate(['/login']).then(r =>  console.log(r));
        return false;
      }
      type AllowedEmails = {
        [key: string]: string[];
      };

      const allowedEmails: AllowedEmails = {
        'cliente': ['carlos.leon@bluetab.net','belkys.rumbos@bluetab.net','jorge.arevalo@bluetab.net','carlos.leon.rupay.contractor@bbva.com'],
        'people': ['jorge.arevalo@bluetab.net','belkys.rumbos@bluetab.net','carlos.leon@bluetab.net'],
        'gestion': ['carlos.leon.rupay.contractor@bbva.com','jorge.arevalo@bluetab.net','belkys.rumbos@bluetab.net','carlos.leon@bluetab.net'],
        'lideres': ['carlos.leon@bluetab.net','jorge.arevalo@bluetab.net','belkys.rumbos@bluetab.net']
      };

      const mainPath = route.pathFromRoot
        .map(snapshot => snapshot.url.map(segment => segment.path).join('/'))
        .filter(path => path)
        .join('/');


      if (mainPath && allowedEmails[mainPath]?.includes(<string>user.email)) {
        return true;
      } Swal.fire({
        title: 'Acceso Denegado',
        text: 'No tienes permiso para acceder a esta página.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      }).then((result) => {
        router.navigate(['/']).then(r => console.log('Redirect after alert'));
      });
      return false;
    })
  );
};

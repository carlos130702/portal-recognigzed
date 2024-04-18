import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./login/login.component";
import {AuthGuard} from "./core/guards";


const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]  // Usar AuthGuard
  },
  { path: 'worker', loadChildren: () => import('./worker/worker.module').then(m => m.WorkerModule) },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

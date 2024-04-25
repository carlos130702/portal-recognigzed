import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {TrabajadoresComponent} from "./trabajadores/trabajadores.component";
import {RegistroTrabajadoresComponent} from "./registro-trabajadores/registro-trabajadores.component";
import {RegistroExamenComponent} from "./registro-examen/registro-examen.component";
import {AuthGuard} from "../core/guards";
import {ExamenesRegistradosComponent} from "./examenes-registrados/examenes-registrados.component";

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: 'trabajadores', component: TrabajadoresComponent, canActivate: [AuthGuard] },
      { path: 'examenes-registrados', component: ExamenesRegistradosComponent, canActivate: [AuthGuard] },
      { path: 'registro-trabajador', component: RegistroTrabajadoresComponent, canActivate: [AuthGuard] },
      { path: 'registro-examen', component: RegistroExamenComponent, canActivate: [AuthGuard] },
      { path: '', redirectTo: 'trabajadores', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {AuthGuard} from "../core/guards";
import {ExamenesComponent} from "./examenes/examenes.component";
import {VistaExamenComponent} from "./vista-examen/vista-examen.component";

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: 'examenes', component: ExamenesComponent, canActivate: [AuthGuard] },
      { path: 'evaluaciones/:id/preview', component: VistaExamenComponent, canActivate: [AuthGuard] },
      { path: 'evaluaciones/:id', component: VistaExamenComponent, canActivate: [AuthGuard] },
      { path: '', redirectTo: 'examenes', pathMatch: 'full' }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkerRoutingModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkerRoutingModule } from './worker-routing.module';
import { HomeComponent } from './home/home.component';
import { ExamenesComponent } from './examenes/examenes.component';
import {MenubarModule} from "primeng/menubar";
import {TableModule} from "primeng/table";
import {ButtonModule} from "primeng/button";
import { VistaExamenComponent } from './vista-examen/vista-examen.component';
import {FormsModule} from "@angular/forms";
import {RadioButtonModule} from "primeng/radiobutton";


@NgModule({
  declarations: [
    HomeComponent,
    ExamenesComponent,
    VistaExamenComponent
  ],
  imports: [
    CommonModule,
    WorkerRoutingModule,
    MenubarModule,
    TableModule,
    ButtonModule,
    FormsModule,
    RadioButtonModule
  ]
})
export class WorkerModule { }

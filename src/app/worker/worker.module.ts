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
import {MessageService} from "primeng/api";
import {ToastModule} from "primeng/toast";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {UpperCamelCasePipe} from "../pipes/upper-camel-case.pipe";

@NgModule({
  declarations: [
    HomeComponent,
    ExamenesComponent,
    VistaExamenComponent,
    UpperCamelCasePipe
  ],
  imports: [
    CommonModule,
    WorkerRoutingModule,
    MenubarModule,
    TableModule,
    ButtonModule,
    FormsModule,
    RadioButtonModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [
    MessageService
  ]
})
export class WorkerModule { }

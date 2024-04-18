import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { HomeComponent } from './home/home.component';
import { TrabajadoresComponent } from './trabajadores/trabajadores.component';
import { RegistroTrabajadoresComponent } from './registro-trabajadores/registro-trabajadores.component';
import { RegistroExamenComponent } from './registro-examen/registro-examen.component';
import {MenubarModule} from "primeng/menubar";
import {TableModule} from "primeng/table";
import {DialogModule} from "primeng/dialog";
import {ButtonModule} from "primeng/button";
import {InputTextModule} from "primeng/inputtext";
import {FormsModule} from "@angular/forms";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {CheckboxModule} from "primeng/checkbox";
import {InputTextareaModule} from "primeng/inputtextarea";


@NgModule({
  declarations: [
    HomeComponent,
    TrabajadoresComponent,
    RegistroTrabajadoresComponent,
    RegistroExamenComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    MenubarModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    ToastModule,
    CheckboxModule,
    InputTextareaModule,
  ],
  providers: [
    MessageService
  ]
})
export class AdminModule { }
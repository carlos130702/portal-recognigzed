import { Component } from '@angular/core';
import {TrabajadoresService} from "../../services/trabajadores.service";
import {Trabajador} from "../../interfaces/Trabajador";
import {MessageService} from "primeng/api";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-registro-trabajadores',
  templateUrl: './registro-trabajadores.component.html',
  styleUrl: './registro-trabajadores.component.css'
})
export class RegistroTrabajadoresComponent {
  trabajador: Trabajador = {
    Nombre: '',
    Apellidos: '',
    Foto: '',
    Usuario: '',
    password: ''
  };
  constructor(
    private trabajadoresService: TrabajadoresService,
    private messageService: MessageService,
    private router: Router,
    private http: HttpClient
  ) { }
  registrarTrabajador() {
    const nuevoTrabajador: Omit<Trabajador, 'id'> = {
      Nombre: this.trabajador.Nombre,
      Apellidos: this.trabajador.Apellidos,
      Foto: this.trabajador.Foto,
      Usuario: this.trabajador.Usuario,
      password: this.trabajador.password
    };
    this.trabajadoresService.addTrabajador(nuevoTrabajador).subscribe({
      next: (trabajadorCreado) => {
        this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Trabajador registrado'});
        setTimeout(() => this.router.navigate(['/admin/trabajadores']), 1000);
      },
      error: (error) => {
        this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al registrar el trabajador'});
        console.error('Error al registrar trabajador', error);
      }
    });
  }

}

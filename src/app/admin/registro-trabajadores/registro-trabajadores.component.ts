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
      name: '',
      lastName: '',
      photo: '',
      user: '',
      password: ''
    };

    constructor(
      private trabajadoresService: TrabajadoresService,
      private messageService: MessageService,
      private router: Router,
      private http: HttpClient
    ) { }
    selectedFile: File | null = null;
    selectedFileUrl: string | ArrayBuffer | null = null;

    onFileSelected(event: any) {
      this.selectedFile = event.target.files[0] as File;
      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = () => {
          this.selectedFileUrl = reader.result;
        };
        reader.readAsDataURL(this.selectedFile);
      }
    }
    registrarTrabajador() {
      const nuevoTrabajador: Omit<Trabajador, 'id'> = {
        name: this.trabajador.name,
        lastName: this.trabajador.lastName,
        photo: this.trabajador.photo,
        user: this.trabajador.user,
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

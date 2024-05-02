import {Component} from '@angular/core';
import {TrabajadoresService} from "../../services/trabajadores.service";
import {Trabajador} from "../../interfaces/Trabajador";
import {MessageService} from "primeng/api";
import {Router} from "@angular/router";

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

  ) {
  }

  selectedFile: File | null = null;
  selectedFileUrl: string | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files ? element.files[0] : null;

    if (file) {
      this.selectedFile = file;
      this.previewFile(file);
      this.uploadFile(file);
    }
  }

  previewFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedFileUrl = reader.result as string;
    };
    reader.onerror = error => {
      console.error('Error loading the image: ', error);
      this.errorMessage = 'Error loading preview.';
      this.selectedFileUrl = null;
    };
    reader.readAsDataURL(file);
  }
  uploadFile(file: File): void {
    this.isLoading = true;
    this.trabajadoresService.uploadFile(file).subscribe({
      next: (url) => {
        this.selectedFileUrl = url;
        this.isLoading = false;
        this.trabajador.photo = url;
      },
      error: (error) => {
        this.errorMessage = 'Failed to upload the file.';
        this.isLoading = false;
      }
    });
  }
  registrarTrabajador() {
    if (this.selectedFile) {
      this.trabajadoresService.uploadFile(this.selectedFile).subscribe({
        next: (url: string) => {
          const nuevoTrabajador: Omit<Trabajador, 'id'> = {
            name: this.trabajador.name,
            lastName: this.trabajador.lastName,
            photo: url,
            user: this.trabajador.user,
            password: this.trabajador.password
          };
          this.trabajadoresService.addTrabajador(nuevoTrabajador).then(() => {
            this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Trabajador registrado'});
            setTimeout(() => this.router.navigate(['/admin/trabajadores']), 1000);
          })
            .catch(error => {
              this.messageService.add({severity: 'error', summary: 'Error', detail: 'Error al registrar el trabajador'});
              console.error('Error al registrar trabajador', error);
            });
        },
        error: (error: any) => {
          console.error('Error al cargar la imagen', error);
          this.messageService.add({severity: 'error', summary: 'Error al cargar la imagen', detail: 'No se pudo cargar la imagen'});
        }
      });
    } else {
    }
  }



}

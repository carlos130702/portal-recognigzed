import {Component, ViewChild} from '@angular/core';
import {TrabajadoresService} from "../../services/trabajadores.service";
import {Trabajador} from "../../interfaces/Trabajador";
import {MessageService} from "primeng/api";
import {Router} from "@angular/router";
import {FileSelectEvent, FileUpload, FileUploadEvent} from "primeng/fileupload";

@Component({
  selector: 'app-registro-trabajadores',
  templateUrl: './registro-trabajadores.component.html',
  styleUrl: './registro-trabajadores.component.css'
})
export class RegistroTrabajadoresComponent {
  @ViewChild('fileUpload', { static: false }) fileUpload!: FileUpload; // Referencia al componente p-fileUpload

  trabajador: Trabajador = {
    name: '',
    lastName: '',
    photo: '',
    user: '',
    password: ''
  };

  selectedFile: File | null = null;
  selectedFileUrl: string | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private trabajadoresService: TrabajadoresService,
    private messageService: MessageService,
    private router: Router
  ) { }

  onFileSelected(event: any): void {
    const file = event.files[0]; // Asegúrate de que estás manejando el primer archivo correctamente

    if (file) {
      this.selectedFile = file;
      this.previewFile(file);
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

  resetFile(): void {
    this.selectedFile = null;
    this.selectedFileUrl = null;

    // Resetear el componente p-fileUpload
    if (this.fileUpload) {
      this.fileUpload.clear(); // Borra el estado del archivo en p-fileUpload
    }
  }

  registrarTrabajador() {
    if (!this.selectedFile) {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'Debe seleccionar una foto.'});
      return;
    }

    this.isLoading = true;
    this.trabajadoresService.uploadFile(this.selectedFile).subscribe({
      next: (url) => {
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
        }).catch(error => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'Error al registrar el trabajador'});
          console.error('Error al registrar trabajador', error);
        });
      },
      error: (error: any) => {
        console.error('Error al cargar la imagen', error);
        this.messageService.add({severity: 'error', summary: 'Error al cargar la imagen', detail: 'No se pudo cargar la imagen'});
      }
    });
  }
}

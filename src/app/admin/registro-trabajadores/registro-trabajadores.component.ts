import {Component, ViewChild} from '@angular/core';
import {TrabajadoresService} from "../../services/trabajadores.service";
import {Trabajador} from "../../interfaces/Trabajador";
import {MessageService} from "primeng/api";
import {Router} from "@angular/router";
import {FileSelectEvent, FileUpload, FileUploadEvent} from "primeng/fileupload";
import {take} from "rxjs";

@Component({
  selector: 'app-registro-trabajadores',
  templateUrl: './registro-trabajadores.component.html',
  styleUrl: './registro-trabajadores.component.css'
})
export class RegistroTrabajadoresComponent {
  @ViewChild('fileUpload', { static: false }) fileUpload!: FileUpload;
  isChecking: boolean = false;

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
  goBack() {
    this.router.navigate(['admin/trabajadores']).then(r => console.log(r));
  }
  onFileSelected(event: any): void {
    const file = event.files[0];

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

    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

  registrarTrabajador(trabajadorForm: any): void {
    if (trabajadorForm.invalid || !this.selectedFile) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor complete todos los campos requeridos y seleccione una foto.' });
      return;
    }
    if (this.isChecking) return;

    this.isChecking = true;

    this.trabajadoresService.checkIfUserExists(this.trabajador.user).pipe(take(1)).subscribe({
      next: (exists) => {
        this.isChecking = false;

        if (exists) {
          this.messageService.clear();
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El usuario ya existe.' });
        } else {
          this.isLoading = true;
          this.trabajadoresService.uploadFile(this.selectedFile!).subscribe({
            next: (url) => {
              const nuevoTrabajador: Omit<Trabajador, 'id'> = {
                name: this.trabajador.name,
                lastName: this.trabajador.lastName,
                photo: url,
                user: this.trabajador.user,
                password: this.trabajador.password
              };
              this.trabajadoresService.addTrabajador(nuevoTrabajador).then(() => {
                this.messageService.clear();
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Trabajador registrado' });
                setTimeout(() => {
                  this.isLoading = false;
                  this.router.navigate(['/admin/trabajadores']).then(r => r);
                }, 1000);
              }).catch(error => {
                this.isLoading = false;
                this.messageService.clear();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar el trabajador' });
                console.error('Error al registrar trabajador', error);
              });
            },
            error: (error: any) => {
              this.isLoading = false;
              this.messageService.clear();
              console.error('Error al cargar la imagen', error);
              this.messageService.add({ severity: 'error', summary: 'Error al cargar la imagen', detail: 'No se pudo cargar la imagen' });
            }
          });
        }
      },
      error: (error) => {
        this.isChecking = false;
        this.messageService.clear();
        console.error('Error al verificar el usuario', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo verificar el usuario' });
      }
    });
  }
}

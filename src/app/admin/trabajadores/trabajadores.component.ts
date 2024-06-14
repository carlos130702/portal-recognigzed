import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {Trabajador} from "../../interfaces/Trabajador";
import {TrabajadoresService} from "../../services/trabajadores.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {Evaluacion, ResultadoDeEvaluacion} from "../../interfaces/Evaluacion";
import {ResultadosService} from "../../services/resultados.service";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {FileUpload} from "primeng/fileupload";

@Component({
  selector: 'app-trabajadores',
  templateUrl: './trabajadores.component.html',
  styleUrls: ['./trabajadores.component.css']
})
export class TrabajadoresComponent implements OnInit, AfterViewInit{
  @ViewChild('fileUpload') fileUpload: FileUpload | undefined;
  trabajadores: Trabajador[] = [];
  displayEditDialog: boolean = false;
  displayViewDialog: boolean = false;
  trabajadoresFiltrados: Trabajador[] = [];
  resultadosEvaluacion: ResultadoDeEvaluacion[] = [];
  evaluaciones: Evaluacion[] = [];
  trabajadorSeleccionado: Trabajador = {
    id: '',
    name: '',
    lastName: '',
    photo: '',
    user: '',
    password: ''
  };
  ngAfterViewInit() {
    this.setupFocus();
  }
  constructor(private confirmationService: ConfirmationService,private cd: ChangeDetectorRef, private evaluacionService: EvaluacionesService, private resultadosService: ResultadosService, private trabajadoresService: TrabajadoresService, private messageService: MessageService,) {
  }

  ngOnInit() {
    this.cargarTrabajadores();
  }
  get emptyTrabajador(): Trabajador {
    return {
      id: '',
      name: '',
      lastName: '',
      photo: '',
      user: '',
      password: ''
    };
  }

  resetDialog() {
    this.trabajadorSeleccionado = this.emptyTrabajador;
    this.resultadosEvaluacion = [];
  }

  cargarTrabajadores() {
    this.trabajadoresService.getTrabajadores().subscribe({
      next: (data: Trabajador[]) => {
        this.trabajadores = data;
        this.trabajadoresFiltrados = data;
      },
      error: (error) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Error al cargar los trabajadores'});
        console.error('Error al obtener trabajadores', error);
      }
    });

  }

  resetFileUpload(): void {
    if (!this.fileUpload) return;
    this.fileUpload.clear();
  }

  cargarResultados(): void {
    if (this.trabajadorSeleccionado && this.trabajadorSeleccionado.id) {
      this.resultadosService.getEvaluacionResultadosDeTrabajador(this.trabajadorSeleccionado.id.toString())
        .subscribe({
          next: (resultados: ResultadoDeEvaluacion[]) => {
            this.resultadosEvaluacion = resultados;
            this.evaluaciones = [];

            if (resultados.length > 0) {
              resultados.forEach((resultado: ResultadoDeEvaluacion) => {
                const evaluacionId = resultado.ID_Evaluacion.toString();

                this.evaluacionService.getEvaluacionById(evaluacionId).subscribe(evaluacion => {
                  this.evaluaciones.push(evaluacion);
                  this.cd.detectChanges();
                });
              });
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al cargar los resultados de la evaluación'
            });
            console.error('Error al obtener resultados de la evaluación', error);
          }
        });
    }
  }

  buscarTrabajadores(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.trabajadoresFiltrados = this.trabajadores.filter(t =>
      `${t.name} ${t.lastName}`.toLowerCase().includes(query)
    );
  }

  getEvaluacionTitulo(idEvaluacion: string): string {
    const evaluacion = this.evaluaciones.find(e => e.id === idEvaluacion);
    return evaluacion ? evaluacion.titulo : 'Cargando...';
  }


  visualizar(trabajador: Trabajador) {
    this.trabajadorSeleccionado = trabajador;
    this.cargarResultados();
    this.displayViewDialog = true;
  }

  editar(trabajador: Trabajador) {
    this.trabajadorSeleccionado = {...trabajador};
    this.displayEditDialog = true;
    this.resetFileUpload();
  }

  onBeforeUpload(event: any): void {
    event.formData.append('trabajadorId', this.trabajadorSeleccionado.id);
  }

  onUpload(event: any): void {
    if (event.files && event.files.length > 0) {
      const file = event.files[0] as File;
      this.trabajadoresService.uploadFile(file).subscribe({
        next: (url: string) => {
          this.trabajadorSeleccionado.photo = url;
          this.cd.markForCheck();
        },
        error: (error) => {
          this.messageService.add({severity: 'error', summary: 'Error al cargar la imagen', detail: 'No se pudo cargar la imagen.'});
        }
      });
    }
  }

  confirmarEdicion(valoresFormulario: any): void {
    if (this.trabajadorSeleccionado && this.trabajadorSeleccionado.id) {
      const datosActualizados: Trabajador = {
        ...this.trabajadorSeleccionado,
        user: valoresFormulario.user,
        password: valoresFormulario.password,
        photo: this.trabajadorSeleccionado.photo
      };
      this.trabajadoresService.editarTrabajador(datosActualizados).then(() => {
        this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Trabajador editado con éxito.'});
        this.displayEditDialog = false;
        this.cd.markForCheck();
      }).catch(error => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Error al editar el trabajador.'});
      });
    }
  }

  eliminar(trabajador: Trabajador) {
    if (trabajador.id == null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El trabajador no tiene un ID válido.'
      });
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar a este trabajador?')) {
      this.trabajadoresService.eliminarTrabajador(trabajador.id).then(() => {
        this.trabajadores = this.trabajadores.filter(t => t.id !== trabajador.id);
        if (this.trabajadoresFiltrados) {
          this.trabajadoresFiltrados = this.trabajadoresFiltrados.filter(t => t.id !== trabajador.id);
        }
        this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Trabajador eliminado con éxito.'});
      }).catch(err => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Error al eliminar el trabajador.'});
        console.error('Error al eliminar el trabajador', err);
      });
    }
  }
  confirmarEliminarResultado(id: string): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar este resultado?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.eliminarResultado(id);
      },
      reject: () => {
        // Acciones si se rechaza
      },
      defaultFocus: 'reject'
    });

    setTimeout(() => {
      this.setupFocus();
    }, 0);
  }

  setupFocus() {
    setTimeout(() => {
      const rejectButton = document.querySelector('.custom-confirm-dialog .p-button-secondary');
      if (rejectButton) {
        (rejectButton as HTMLElement).focus();
      }
    }, 100);
  }

  eliminarResultado(id: string): void {
    this.resultadosService.deleteEvaluacionResultado(id).then(() => {
      this.resultadosEvaluacion = this.resultadosEvaluacion.filter(r => r.id !== id);
    }).catch(error => {
      console.error('Error eliminando resultado:', error);
    });
  }
}

import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Trabajador} from "../../interfaces/Trabajador";
import {TrabajadoresService} from "../../services/trabajadores.service";
import {MessageService} from "primeng/api";
import {Evaluacion, ResultadoDeEvaluacion} from "../../interfaces/Evaluacion";
import {ResultadosService} from "../../services/resultados.service";
import {EvaluacionesService} from "../../services/evaluaciones.service";

@Component({
  selector: 'app-trabajadores',
  templateUrl: './trabajadores.component.html',
  styleUrl: './trabajadores.component.css'
})
export class TrabajadoresComponent implements OnInit {
  trabajadores: Trabajador[] = [];
  displayDialog: boolean = false;
  trabajadorSeleccionado?: Trabajador;
  trabajadoresFiltrados: Trabajador[] = [];
  resultadosEvaluacion: ResultadoDeEvaluacion[] = [];
  evaluaciones: Evaluacion[] = [];

  constructor(  private cd: ChangeDetectorRef,private evaluacionService: EvaluacionesService,private resultadosService: ResultadosService,private trabajadoresService: TrabajadoresService,private messageService: MessageService,) { }

  ngOnInit() {
    this.cargarTrabajadores();
  }

  cargarTrabajadores() {
    this.trabajadoresService.getTrabajadores().subscribe({
      next: (data: Trabajador[]) => {
        this.trabajadores = data;
        this.trabajadoresFiltrados = data;
      },
      error: (error) => {
        this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al cargar los trabajadores'});
        console.error('Error al obtener trabajadores', error);
      }
    });

  }

  cargarResultados(): void {
    if (this.trabajadorSeleccionado && this.trabajadorSeleccionado.id) {
      const trabajadorId = this.trabajadorSeleccionado.id.toString();

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
        this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al cargar los resultados de la evaluación'});
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
  getEvaluacionTitulo(idEvaluacion: number): string {
    const evaluacion = this.evaluaciones.find(e => e.id === idEvaluacion);
    return evaluacion ? evaluacion.titulo : 'Cargando...';
  }


  visualizar(trabajador: Trabajador) {
    this.trabajadorSeleccionado = trabajador;
    this.cargarResultados();
    this.displayDialog = true;
  }

  editar(trabajador: Trabajador) {
    // Lógica para editar el trabajador
  }

  eliminar(trabajador: Trabajador) {
    console.log('ID del trabajador a eliminar:', trabajador.id);
    if (trabajador.id == null) {
      this.messageService.add({severity:'warn', summary: 'Advertencia', detail: 'El trabajador no tiene un ID válido.'});
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar a este trabajador?')) {
      this.trabajadoresService.eliminarTrabajador(trabajador.id).subscribe({
        next: (resp) => {
          this.trabajadores = this.trabajadores.filter(t => t.id !== trabajador.id);
          if (this.trabajadoresFiltrados) {
            this.trabajadoresFiltrados = this.trabajadoresFiltrados.filter(t => t.id !== trabajador.id);
          }
          this.messageService.add({ severity:'success', summary: 'Éxito', detail: 'Trabajador eliminado con éxito.' });
          console.log('Trabajador eliminado con éxito', resp);
        },
        error: (err) => {
          this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al eliminar el trabajador.'});
          console.error('Error al eliminar el trabajador', err);
        }
      });
    }
  }

}

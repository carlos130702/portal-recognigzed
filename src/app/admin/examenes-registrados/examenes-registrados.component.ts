import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Evaluacion, Opcion, Pregunta} from "../../interfaces/Evaluacion";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {MessageService} from "primeng/api";
import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-examenes-registrados',
  templateUrl: './examenes-registrados.component.html',
  styleUrl: './examenes-registrados.component.css'
})
export class ExamenesRegistradosComponent implements OnInit {
  evaluaciones: Evaluacion[] = [];
  evaluacionesFiltradas: Evaluacion[] = [];
  evaluacionSeleccionada?: Evaluacion;
  displayDialog: boolean = false;
  displayViewDialog: boolean = false;
  displayEditDialog: boolean = false;
  evaluacionForm: FormGroup;
  indiceActual: number = 0;

  constructor(
    private cd: ChangeDetectorRef,
    private evaluacionService: EvaluacionesService,
    private messageService: MessageService,private fb: FormBuilder
  ) {
    this.evaluacionForm = this.fb.group({
      id: [null],
      titulo: [''],
      descripcion: [''],
      preguntas: this.fb.array([])
    });
  }

  ngOnInit() {
    this.cargarEvaluaciones();
  }

  siguiente() {
    if (this.evaluacionSeleccionada && this.indiceActual < (this.evaluacionSeleccionada.preguntas?.length || 0) - 1) {
      this.indiceActual++;
    }
  }

  anterior() {
    if (this.indiceActual > 0) {
      this.indiceActual--;
    }
  }

  cargarEvaluaciones() {
    this.evaluacionService.getEvaluaciones().subscribe({
      next: (data: Evaluacion[]) => {
        this.evaluaciones = data;
        this.evaluacionesFiltradas = data;
      },
      error: (error) => {
        this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al cargar las evaluaciones'});
        console.error('Error al obtener evaluaciones', error);
      }
    });
  }

  buscarEvaluaciones(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.evaluacionesFiltradas = this.evaluaciones.filter(e =>
      e.titulo.toLowerCase().includes(query)
    );
  }

  visualizar(evaluacion: Evaluacion) {
    this.evaluacionSeleccionada = evaluacion;
    this.displayViewDialog = true;
  }
  get preguntas(): FormArray {
    return this.evaluacionForm.get('preguntas') as FormArray;
  }
  editarEvaluacion(evaluacion: Evaluacion) {
    if (!this.evaluacionForm.contains('id')) {
      this.evaluacionForm.addControl('id', new FormControl(''));
    }

    this.evaluacionForm.patchValue({
      id: evaluacion.id,
      titulo: evaluacion.titulo,
      descripcion: evaluacion.descripcion,
    });
    this.setPreguntas(evaluacion.preguntas);
    this.displayEditDialog = true;
  }
  guardarEvaluacion() {
    if (this.evaluacionForm.valid) {
      console.log(this.evaluacionForm.value);
      this.evaluacionService.actualizarEvaluacion(this.evaluacionForm.value).subscribe({
        next: (respuesta) => {
          this.displayEditDialog = false;
          this.cargarEvaluaciones();
          this.messageService.add({
            severity: 'success',
            summary: 'Actualización exitosa',
            detail: 'La actualización del examen fue exitosa.'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Hubo un problema al actualizar el examen.'
          });
        }
      });
    }
  }


  getOpciones(preguntaIndex: number): FormArray {
    return this.preguntas.at(preguntaIndex).get('opciones') as FormArray;
  }

  setPreguntas(preguntas: Pregunta[]) {
    const preguntasFGs = preguntas.map(pregunta => {
      const opcionesFGs = pregunta.opciones.map(opcion =>
        this.fb.group({
          texto: opcion.texto,
          esCorrecta: opcion.esCorrecta
        })
      );

      const opcionesFormArray = this.fb.array(opcionesFGs);

      return this.fb.group({
        enunciado: pregunta.enunciado,
        opciones: opcionesFormArray,
        valor: pregunta.valor
      });
    });

    const preguntasFormArray = this.fb.array(preguntasFGs);
    this.evaluacionForm.setControl('preguntas', preguntasFormArray);
  }
  establecerRespuestaCorrecta(preguntaIndex: number, opcionSeleccionadaIndex: number) {
    const opciones = (this.preguntas.at(preguntaIndex).get('opciones') as FormArray).controls;

    opciones.forEach((opcionFG, index) => {
      const esCorrectaControl = opcionFG.get('esCorrecta');
      if (esCorrectaControl) {
        esCorrectaControl.setValue(index === opcionSeleccionadaIndex);
      }
    });
  }

  eliminar(evaluacion: Evaluacion) {
    if (evaluacion.id == null) {
      this.messageService.add({severity:'warn', summary: 'Advertencia', detail: 'La evaluación no tiene un ID válido.'});
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar esta evaluación?')) {
      this.evaluacionService.deleteEvaluacion(evaluacion.id).subscribe({
        next: (resp) => {
          this.evaluaciones = this.evaluaciones.filter(e => e.id !== evaluacion.id);
          this.evaluacionesFiltradas = this.evaluacionesFiltradas.filter(e => e.id !== evaluacion.id);
          this.messageService.add({ severity:'success', summary: 'Éxito', detail: 'Evaluación eliminada con éxito.' });
          console.log('Evaluación eliminada con éxito', resp);
        },
        error: (err) => {
          this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al eliminar la evaluación.'});
          console.error('Error al eliminar la evaluación', err);
        }
      });
    }
  }
}

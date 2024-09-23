import {Component, OnInit} from '@angular/core';
import {Evaluacion,Pregunta} from "../../interfaces/Evaluacion";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {ConfirmationService, MessageService} from "primeng/api";
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
  displayViewDialog: boolean = false;
  displayEditDialog: boolean = false;
  evaluacionForm: FormGroup;
  indiceActual: number = 0;

  constructor(
    private evaluacionService: EvaluacionesService,
    private messageService: MessageService, private fb: FormBuilder,
    private confirmationService: ConfirmationService
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
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Error al cargar las evaluaciones'});
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

  validarPreguntasDuplicadas(preguntas: any[]): boolean {
    const enunciados = preguntas.map(p => p.enunciado.trim().toLowerCase());
    const duplicados = new Set(enunciados).size !== enunciados.length;
    return duplicados;
  }

  validarOpcionesDuplicadas(preguntas: any[]): boolean {
    for (const pregunta of preguntas) {
      const opcionesTexto = pregunta.opciones.map((o: { texto: string; }) => o.texto.trim().toLowerCase());
      const duplicados = new Set(opcionesTexto).size !== opcionesTexto.length;
      if (duplicados) {
        return true;
      }
    }
    return false;
  }

  agregarPregunta(): void {
    const preguntaGroup = this.fb.group({
      enunciado: [''],
      opciones: this.fb.array([
        this.fb.group({ texto: '', esCorrecta: false }),
        this.fb.group({ texto: '', esCorrecta: false }),
        this.fb.group({ texto: '', esCorrecta: false }),
        this.fb.group({ texto: '', esCorrecta: false })
      ]),
      valor: 0
    });

    this.preguntas.push(preguntaGroup);
    this.recalcularValores();
  }
  eliminarPregunta(index: number): void {
    this.preguntas.removeAt(index);
    this.recalcularValores();
  }
  recalcularValores(): void {
    const valorPorPregunta = 20 / this.preguntas.length;
    this.preguntas.controls.forEach(pregunta => {
      pregunta.get('valor')?.setValue(valorPorPregunta);
    });
  }
  validarOpcionCorrecta(preguntas: Pregunta[]): boolean {
    return preguntas.every(pregunta =>
      pregunta.opciones.some(opcion => opcion.esCorrecta)
    );
  }
  validarCamposVacios(preguntas: Pregunta[]): boolean {
    for (const pregunta of preguntas) {
      if (!pregunta.enunciado || pregunta.enunciado.trim() === '') {
        return true;
      }
      for (const opcion of pregunta.opciones) {
        if (!opcion.texto || opcion.texto.trim() === '') {
          return true;
        }
      }
    }
    return false;
  }
  guardarEvaluacion() {
    if (this.evaluacionForm.valid) {
      const evaluacion: Evaluacion = this.evaluacionForm.value;

      if (this.validarPreguntasDuplicadas(evaluacion.preguntas)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Existen preguntas duplicadas en la evaluación.'
        });
        return;
      }

      if (this.validarOpcionesDuplicadas(evaluacion.preguntas)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Existen opciones duplicadas en algunas preguntas.'
        });
        return;
      }
      if (!this.validarOpcionCorrecta(evaluacion.preguntas)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Cada pregunta debe tener una opción marcada como correcta.'
        });
        return;
      }
      if (this.validarCamposVacios(evaluacion.preguntas)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ningún campo puede estar vacío o contener solo espacios.'
        });
        return;
      }
      if (!evaluacion.id || evaluacion.id.trim() === '') {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'La evaluación no tiene un ID válido.'
        });
        return;
      }

      this.evaluacionService.actualizarEvaluacion(evaluacion).then(() => {
        this.displayEditDialog = false;
        this.cargarEvaluaciones();
        this.messageService.add({
          severity: 'success',
          summary: 'Actualización exitosa',
          detail: 'La actualización del examen fue exitosa.'
        });
      }).catch((error) => {
        console.error('Error al actualizar la evaluación:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Hubo un problema al actualizar el examen.'
        });
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'La evaluación no tiene un ID válido.'
      });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar esta evaluación?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      defaultFocus: 'reject',
      accept: () => {
        this.evaluacionService.deleteEvaluacion(evaluacion.id).then(() => {
          this.evaluaciones = this.evaluaciones.filter(e => e.id !== evaluacion.id);
          this.evaluacionesFiltradas = this.evaluacionesFiltradas.filter(e => e.id !== evaluacion.id);
          this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Evaluación eliminada con éxito.'});
        }).catch(err => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'Error al eliminar la evaluación.'});
          console.error('Error al eliminar la evaluación', err);
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'La eliminación de la evaluación ha sido cancelada.'
        });
      }
    });
  }

}

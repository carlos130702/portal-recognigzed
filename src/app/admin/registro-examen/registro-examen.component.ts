import { Component } from '@angular/core';
import {Evaluacion, Pregunta} from "../../interfaces/Evaluacion";
import {MessageService} from "primeng/api";
import {Router} from "@angular/router";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-registro-examen',
  templateUrl: './registro-examen.component.html',
  styleUrl: './registro-examen.component.css'
})
export class RegistroExamenComponent {
  evaluacion: Evaluacion = {
    titulo: '',
    descripcion: '',
    preguntas: []
  };

  constructor(
    private evaluacionesService: EvaluacionesService,
    private messageService: MessageService,
    private router: Router
  ) { }
  numPreguntas: number = 0;
  maxOpciones: number = 4;
  mostrarFormulario: boolean = true;
  preguntaActualIndex: number = 0;

  siguientePregunta(): void {
    if (this.preguntaActualIndex < this.evaluacion.preguntas.length - 1) {
      this.preguntaActualIndex++;
    }
  }

  anteriorPregunta(): void {
    if (this.preguntaActualIndex > 0) {
      this.preguntaActualIndex--;
    }
  }
  agregarPregunta() {
    console.log(this.evaluacion.id)
    if (!this.evaluacion.id) {
      console.error('Error: La evaluación no tiene un ID válido.');
      return;
    }
    if (Array.isArray(this.evaluacion.preguntas)) {
      const nuevaPregunta: Pregunta = {
        enunciado: '',
        opciones: [],
        valor: 0
      };
      this.evaluacion.preguntas.push(nuevaPregunta);
      this.preguntaActualIndex = this.evaluacion.preguntas.length - 1;
    } else {
      console.error('Error: La propiedad preguntas no está definida como un array.');
    }
  }



  guardarEvaluacionCompleta() {
    if (!this.evaluacion || !this.evaluacion.titulo || !this.evaluacion.descripcion || !this.evaluacion.preguntas || this.evaluacion.preguntas.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe completar la evaluación antes de guardarla.' });
      return;
    }

    this.evaluacionesService.deleteEvaluacion(this.evaluacion.id).subscribe(() => {
      this.evaluacionesService.addEvaluacion(this.evaluacion).subscribe({
        next: (evaluacionGuardada: Evaluacion) => {
          this.evaluacion = evaluacionGuardada;
          this.messageService.add({
            severity: 'success',
            summary: 'Evaluación Guardada',
            detail: 'La evaluación se ha guardado correctamente.'
          });
          setTimeout(() => {
            this.router.navigate(['/admin/trabajadores']);
          }, 1000);
        },
        error: () => {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo guardar la evaluación.'});
        }
      });
    });
  }



  numPreguntasInvalido(): boolean {
    return this.numPreguntas < 1 || this.numPreguntas > 20;
  }

  botonDeshabilitado(): boolean {
    return !this.evaluacion.titulo || !this.evaluacion.descripcion || this.numPreguntasInvalido() || this.evaluacion.preguntas.length >= this.numPreguntas;
  }
  guardarEvaluacionSinPreguntas() {
    if (!this.evaluacion || !this.evaluacion.titulo || !this.evaluacion.descripcion) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe ingresar un título y una descripción.' });
      return;
    }

    if (this.evaluacion.preguntas && this.evaluacion.preguntas.length > 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'No se pueden guardar preguntas en una evaluación sin preguntas.' });
      return;
    }

    let valorPorPregunta: number;
    if (this.numPreguntas === 1) {
      valorPorPregunta = 20;
    } else if (this.numPreguntas === 2) {
      valorPorPregunta = 10;
    } else {
      valorPorPregunta = 20 / this.numPreguntas;
    }

    for (let i = 0; i < this.numPreguntas; i++) {
      const nuevaPregunta: Pregunta = {
        enunciado: '',
        opciones: [],
        valor: valorPorPregunta
      };
      this.evaluacion.preguntas.push(nuevaPregunta);
    }

    this.evaluacionesService.addEvaluacion(this.evaluacion).subscribe({
      next: (evaluacionGuardada: Evaluacion) => {
        this.evaluacion = evaluacionGuardada;
        this.messageService.add({ severity: 'success', summary: 'Evaluación Guardada', detail: 'Ahora puede agregar preguntas.' });
        this.mostrarFormulario = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la evaluación.' });
      }
    });
  }


  preguntaValida(): boolean {
    if (this.evaluacion.preguntas.length === 0) {
      return true;
    }
    const ultimaPregunta = this.evaluacion.preguntas[this.evaluacion.preguntas.length - 1];
    const opcionesCorrectas = ultimaPregunta.opciones.filter(opcion => opcion.esCorrecta);
    return opcionesCorrectas.length > 0 && ultimaPregunta.opciones.length === this.maxOpciones;
  }

  agregarOpciones(pregunta: Pregunta) {
    const idPregunta = pregunta.id ?? 0;
    while (pregunta.opciones.length < this.maxOpciones) {
      pregunta.opciones.push({

        texto: '',
        esCorrecta: false
      });
    }
  }


  seleccionarOpcion(pregunta: Pregunta, opcionSeleccionada: any) {
    pregunta.opciones.forEach((op: { esCorrecta: boolean; }) => {
      op.esCorrecta = false;
    });
    opcionSeleccionada.esCorrecta = true;
  }

  todasLasPreguntasCompletas(): boolean {
    if (this.evaluacion.preguntas.length === 0) {
      return false;
    }

    for (const pregunta of this.evaluacion.preguntas) {
      if (!this.preguntaCompleta(pregunta)) {
        return false;
      }
    }
    return true;
  }


  preguntaCompleta(pregunta: Pregunta): boolean {
    return pregunta.opciones && pregunta.opciones.length >= 4 && pregunta.opciones.some(opcion => opcion.texto && opcion.texto.trim() !== '' && opcion.esCorrecta);
  }

}

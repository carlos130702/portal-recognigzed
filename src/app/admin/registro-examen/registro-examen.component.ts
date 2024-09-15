import {Component, OnDestroy} from '@angular/core';
import {Evaluacion, Pregunta} from "../../interfaces/Evaluacion";
import {MessageService} from "primeng/api";
import {Router} from "@angular/router";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {firstValueFrom,Subscription} from "rxjs";

@Component({
  selector: 'app-registro-examen',
  templateUrl: './registro-examen.component.html',
  styleUrls: ['./registro-examen.component.css']
})
export class RegistroExamenComponent implements OnDestroy {
  evaluacion: Evaluacion = {
    titulo: '',
    descripcion: '',
    preguntas: []
  };
  numPreguntas: number = 0;
  maxOpciones: number = 4;
  mostrarFormulario: boolean = true;
  preguntaActualIndex: number = 0;
  tituloEsUnico: boolean = true;
  private subscriptions: Subscription[] = [];
  private evaluacionesSubscription: Subscription | undefined;

  constructor(
    private evaluacionesService: EvaluacionesService,
    private messageService: MessageService,
    private router: Router
  ) {
  }
  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }


  siguientePregunta(): void {
    if (this.validarPreguntaActual()) {
      if (this.preguntaActualIndex < this.evaluacion.preguntas.length - 1) {
        this.preguntaActualIndex++;
      }
    }
  }

  tieneOpcionesDuplicadas(pregunta: Pregunta): boolean {
    let textoOpciones = pregunta.opciones.map(opcion => opcion.texto.trim().toLowerCase());
    let unicos = new Set(textoOpciones);
    return unicos.size !== textoOpciones.length;
  }

  tieneEnunciadosDuplicados(): boolean {
    const enunciados = this.evaluacion.preguntas.map(pregunta => pregunta.enunciado.trim().toLowerCase());
    const enunciadosUnicos = new Set(enunciados);
    return enunciadosUnicos.size !== enunciados.length;
  }

  validarPreguntaActual(): boolean {
    const preguntaActual = this.evaluacion.preguntas[this.preguntaActualIndex];

    if (this.tieneOpcionesDuplicadas(preguntaActual)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No puede haber opciones duplicadas.'
      });
      return false;
    }

    return true;
  }
  goBack() {
    this.router.navigate(['admin/examenes-registrados']).then(r => console.log(r));
  }
  anteriorPregunta(): void {
    if (this.preguntaActualIndex > 0) {
      this.preguntaActualIndex--;
    }
  }


  async guardarEvaluacionCompleta() {
    if (this.evaluacionesSubscription) {
      this.evaluacionesSubscription.unsubscribe();
    }
    if (!this.evaluacion || !this.evaluacion.titulo || !this.evaluacion.descripcion || this.evaluacion.preguntas.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe completar la evaluación antes de guardarla.'
      });
      return;
    }
    if (this.tieneEnunciadosDuplicados()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No puede haber enunciados de pregunta duplicados en el examen.'
      });
      return;
    }
    if (this.todasLasPreguntasCompletas() && this.validarPreguntaActual()) {
      try {
        const evaluaciones = await firstValueFrom(this.evaluacionesService.getEvaluaciones());
        if (this.evaluacion.id) {
          await this.procesoGuardarEvaluacion();
          this.messageService.add({
            severity: 'success',
            summary: 'Guardado Exitoso',
            detail: 'El examen ha sido guardado satisfactoriamente.'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ya existe una evaluación con el mismo título.'
          });
        }
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al verificar la unicidad del título.'
        });
      }
    }
  }

  async procesoGuardarEvaluacion() {
    if (this.evaluacion.id == null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La evaluación no tiene un ID válido.'
      });
      return;
    }
    try {
      await this.evaluacionesService.actualizarEvaluacion(this.evaluacion);
      setTimeout(async () => {
        await this.router.navigate(['/admin/examenes-registrados']);
      }, 1500);
    } catch (error) {
      console.error("Error durante el proceso de guardado", error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo completar la operación de guardado.'
      });
    }
  }

  numPreguntasInvalido(): boolean {
    return this.numPreguntas < 1 || this.numPreguntas > 20;
  }

  botonDeshabilitado(): boolean {
    return !this.evaluacion.titulo || !this.evaluacion.descripcion || this.numPreguntasInvalido();
  }


  async guardarEvaluacionSinPreguntas() {
    if (!this.evaluacion || !this.evaluacion.titulo || !this.evaluacion.descripcion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe ingresar un título y una descripción.'
      });
      return;
    }

    const normalizedTitulo = this.evaluacionesService.normalizeString(this.evaluacion.titulo);

    const tituloEsUnico = await firstValueFrom(this.evaluacionesService.checkTituloUnico(normalizedTitulo));
    console.log('normalizedTitulo', normalizedTitulo);
    if (!tituloEsUnico) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ya existe una evaluación con el mismo título.'
      });
      return;
    }

    let valorPorPregunta = this.numPreguntas === 1 ? 20 : 20 / this.numPreguntas;
    for (let i = 0; i < this.numPreguntas; i++) {
      const nuevaPregunta: Pregunta = {
        enunciado: '',
        opciones: [],
        valor: valorPorPregunta
      };
      this.evaluacion.preguntas.push(nuevaPregunta);
    }

    await this.procederConGuardarEvaluacionSinPreguntas();
  }


  async procederConGuardarEvaluacionSinPreguntas() {
    try {
      this.evaluacion = await this.evaluacionesService.addEvaluacion(this.evaluacion);
      this.messageService.add({
        severity: 'success',
        summary: 'Evaluación Guardada',
        detail: 'Ahora puede agregar preguntas.'
      });
      this.mostrarFormulario = false;
    } catch (error) {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo guardar la evaluación.'});
    }
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

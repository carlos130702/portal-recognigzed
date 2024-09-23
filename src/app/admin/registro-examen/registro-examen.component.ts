import {Component, OnDestroy, OnInit} from '@angular/core';
import {Evaluacion, Opcion, Pregunta} from "../../interfaces/Evaluacion";
import {ConfirmationService, MessageService} from "primeng/api";
import {ActivatedRoute, Router} from "@angular/router";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {firstValueFrom, Subscription} from "rxjs";

@Component({
  selector: 'app-registro-examen',
  templateUrl: './registro-examen.component.html',
  styleUrls: ['./registro-examen.component.css']
})
export class RegistroExamenComponent implements OnDestroy , OnInit {
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
  tituloInvalido: boolean = false;
  descripcionInvalida: boolean = false;
  evaluacionCompletada = false;
  sugerenciasTitulo: string[] = [];
  isAddingQuestions: boolean = false;
  activeIndex = 0;
  steps = [
    { label: 'Registrar Evaluación' },
    { label: 'Agregar Preguntas' }
  ];

  constructor(
    private evaluacionesService: EvaluacionesService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService
  ) {
  }
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['titulo']) {
        this.evaluacion.titulo = params['titulo'];
      }
      if (params['descripcion']) {
        this.evaluacion.descripcion = params['descripcion'];
      }
    });
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
  goBack(): void {
    if (this.evaluacion.id) {
      this.confirmationService.confirm({
        message: '¿Estás seguro de que deseas salir antes de terminar de configurar tu examen?',
        header: 'Confirmación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí',
        rejectLabel: 'No',
        accept: () => {
          this.router.navigate(['admin/examenes-registrados']);
        }
      });
    } else {
      this.router.navigate(['admin/examenes-registrados']);
    }
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
      this.evaluacionCompletada = true;
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
  async validarTitulo() {
    this.tituloInvalido = this.evaluacion.titulo.trim().length === 0;

    if (!this.tituloInvalido) {
      try {
        this.tituloEsUnico = await firstValueFrom(this.evaluacionesService.checkTituloUnico(this.evaluacion.titulo));

        if (!this.tituloEsUnico) {
          this.generarSugerenciasTitulo(this.evaluacion.titulo);
        } else {
          this.sugerenciasTitulo = [];
        }
      } catch (error) {
        console.error('Error checking title uniqueness:', error);
        this.tituloEsUnico = true;
        this.sugerenciasTitulo = [];
      }
    } else {
      this.tituloEsUnico = true;
      this.sugerenciasTitulo = [];
    }
  }

  selectSugerencia(sugerencia: string) {
    this.evaluacion.titulo = sugerencia;
    this.validarTitulo();
  }

  generarSugerenciasTitulo(tituloBase: string) {
    const palabrasExtra = ['Examen', 'Prueba', 'Final', 'Revisión', 'Edición', 'Versión', 'Evaluación', 'Test'];
    const sugerencias = new Set<string>();

    while (sugerencias.size < 5) {
      const randomWord = palabrasExtra[Math.floor(Math.random() * palabrasExtra.length)];
      const randomSuffix = Math.floor(Math.random() * 100) + 1;

      sugerencias.add(`${tituloBase} ${randomWord}`);
      sugerencias.add(`${tituloBase} - ${randomWord} ${randomSuffix}`);
      sugerencias.add(`${randomWord} de ${tituloBase}`);
      sugerencias.add(`${tituloBase} ${randomSuffix}`);
    }
    this.sugerenciasTitulo = Array.from(sugerencias).slice(0, 5);
  }


  validarDescripcion(): void {
    this.descripcionInvalida = this.evaluacion.descripcion.trim().length === 0;
  }

  numPreguntasInvalido(): boolean {
    return this.numPreguntas < 1 || this.numPreguntas > 20;
  }

  botonDeshabilitado(): boolean {
    const tituloValido = this.evaluacion.titulo.trim().length > 0;
    const descripcionValida = this.evaluacion.descripcion.trim().length > 0;
    return !tituloValido || !descripcionValida || this.numPreguntasInvalido() || !this.tituloEsUnico || this.isAddingQuestions;
  }

  async guardarEvaluacionSinPreguntas() {
    this.isAddingQuestions = true;
    this.tituloEsUnico = true;

    if (!this.evaluacion || !this.evaluacion.titulo || !this.evaluacion.descripcion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe ingresar un título y una descripción.'
      });
      this.isAddingQuestions = false;
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
      this.isAddingQuestions = false;
      this.tituloEsUnico = false;
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
    this.activeIndex = 1;
    this.isAddingQuestions = false;
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

  seleccionarOpcion(pregunta: Pregunta, opcionSeleccionada: Opcion) {
    pregunta.opciones.forEach((op: { esCorrecta: boolean; }) => {
      op.esCorrecta = false;
    });
    opcionSeleccionada.esCorrecta = true;
  }

  validarOpcion(opcion: any) {
    opcion.texto = opcion.texto.trim();
  }

  opcionInvalida(opcion: any): boolean {
    return !opcion.texto || opcion.texto.trim().length === 0;
  }

  todasLasPreguntasCompletas(): boolean {
    if (!this.evaluacion.preguntas || this.evaluacion.preguntas.length === 0) {
      return false;
    }
    return this.evaluacion.preguntas.every(pregunta => this.preguntaCompleta(pregunta));
  }



  preguntaCompleta(pregunta: Pregunta): boolean {
    if (!pregunta.enunciado || pregunta.enunciado.trim() === '') {
      return false;
    }

    if (!pregunta.opciones || pregunta.opciones.length < 4) {
      return false;
    }

    for (const opcion of pregunta.opciones) {
      if (!opcion.texto || opcion.texto.trim() === '') {
        return false;
      }
    }

    if (!pregunta.opciones.some(opcion => opcion.esCorrecta)) {
      return false;
    }
    return true;
  }


}

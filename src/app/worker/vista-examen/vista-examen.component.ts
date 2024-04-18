import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Evaluacion, ResultadoDeEvaluacion} from "../../interfaces/Evaluacion";
import {ActivatedRoute, Router} from "@angular/router";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {Trabajador} from "../../interfaces/Trabajador";
import {ResultadosService} from "../../services/resultados.service";
import {tap} from "rxjs";
import {catchError} from "rxjs/operators";
import {AuthService, User} from "../../core/services/auth.service";

@Component({
  selector: 'app-vista-examen',
  templateUrl: './vista-examen.component.html',
  styleUrl: './vista-examen.component.css'
})
export class VistaExamenComponent implements OnInit {
  exam: Evaluacion | undefined;
  trabajadorActual: Trabajador | null = null;
  userAnswers: { [key: number]: string } = {};
  currentQuestionIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: EvaluacionesService,
    private resultadosService:ResultadosService,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const examId = this.route.snapshot.params['id'];
    this.loadExam(examId);
    const usuarioActual = this.authService.getCurrentUser();
    console.log('Usuario actual:', usuarioActual);

    if (this.esTrabajador(usuarioActual)) {
      this.trabajadorActual = usuarioActual;
    }

    console.log('Trabajador actual después de la asignación:', this.trabajadorActual);  // Esto debería mostrarte si la asignación fue exitosa
  }
  private esTrabajador(usuario: any): usuario is Trabajador {
    return typeof usuario.id === 'string' && usuario.role === 'trabajador';
  }

  loadExam(id: number): void {
    this.evaluacionesService.getEvaluacionById(id.toString()).subscribe(
      (data) => {
        this.exam = data;
        this.initializeAnswers();
      },
    );
  }
  initializeAnswers(): void {
    if (!this.exam) return;
    this.exam.preguntas.forEach((pregunta, index) => {
      this.userAnswers[index] = '';
    });
  }

  goToNextQuestion(): void {
    if (!this.exam) return;
    if (this.currentQuestionIndex < this.exam.preguntas.length - 1) {
      this.currentQuestionIndex++;
    }
  }


  goToPreviousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }
  onSubmit() {
    console.log('1');
    this.changeDetectorRef.detectChanges();
    let puntuacion = 0;
    if (!this.exam) return;
    console.log(this.trabajadorActual)
    if (this.trabajadorActual === null) return;
    console.log('2');
    this.exam.preguntas.forEach((pregunta, index) => {
      const selectedOption = this.userAnswers[index];
      const correctOption = pregunta.opciones.find(opcion => opcion.esCorrecta);

      if (selectedOption === correctOption?.texto) {
        puntuacion += pregunta.valor;
      }
    });

    console.log('3');
    const resultado: ResultadoDeEvaluacion = {
      ID_Trabajador: this.trabajadorActual.id as number,
      ID_Evaluacion: this.exam.id as number,
      Puntuacion: puntuacion
    };
    console.log('Submitting to results service...', resultado);


    this.resultadosService.submitEvaluacionResultado(resultado)
      .pipe(

        tap((res: any) => {
          console.log('Evaluation result submitted successfully', res);
        }),
        catchError((error: any) => {
          console.error('Error submitting evaluation result', error);
          throw error;
        })
      )
      .subscribe();
    this.router.navigate(['/worker/examenes']);

  }
}

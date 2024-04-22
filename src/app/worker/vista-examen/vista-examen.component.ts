import {ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Evaluacion, ResultadoDeEvaluacion} from "../../interfaces/Evaluacion";
import {ActivatedRoute, Router} from "@angular/router";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {Trabajador} from "../../interfaces/Trabajador";
import {ResultadosService} from "../../services/resultados.service";
import {tap} from "rxjs";
import {catchError} from "rxjs/operators";
import {AuthService} from "../../core/services/auth.service";
import * as faceapi from 'face-api.js';
import {MessageService} from "primeng/api";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-vista-examen',
  templateUrl: './vista-examen.component.html',
  styleUrl: './vista-examen.component.css'
})
export class VistaExamenComponent implements OnInit , OnDestroy{
  exam: Evaluacion | undefined;
  trabajadorActual: Trabajador | null = null;
  userAnswers: { [key: number]: string } = {};
  currentQuestionIndex = 0;
  labeledFaceDescriptors: faceapi.LabeledFaceDescriptors | null = null;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  intervalId: number | undefined;
  private isModelLoaded: boolean | undefined;
  private failedAttempts = 1;
  private verificationActive = true;
  cameraLoaded = false;
  onCameraLoad() {
    this.cameraLoaded = true;
    console.log('Camera loaded:', this.cameraLoaded);
  }
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: EvaluacionesService,
    private resultadosService:ResultadosService,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const examId = this.route.snapshot.params['id'];
    this.loadExam(examId);
    const usuarioActual = this.authService.getCurrentUser();
    console.log('Usuario actual:', usuarioActual);

    if (this.esTrabajador(usuarioActual)) {
      this.trabajadorActual = usuarioActual;
      this.loadModels().then(() => {
        this.createReferenceFaceDescriptor().then((isDescriptorCreated) => {
          if (isDescriptorCreated) {
            this.startVideo();
          } else {
            console.error('Failed to create face descriptor.');
          }
        }).catch(e => console.error(e));
      }).catch(error => {
        console.error("Error loading models:", error);
      });
    } else {
      console.error('Usuario actual no es un trabajador o no está definido');
    }
  }


  ngOnDestroy(): void {
    if (this.videoElement && this.videoElement.nativeElement.srcObject) {
      (this.videoElement.nativeElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

  }
  async createReferenceFaceDescriptor(): Promise<boolean> {
    if (this.trabajadorActual) {
      try {
        console.log('Loading reference image:', this.trabajadorActual.photo);
        const image = await faceapi.fetchImage(this.trabajadorActual.photo);
        const singleResult = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
        if (singleResult) {
          this.labeledFaceDescriptors = new faceapi.LabeledFaceDescriptors(
            this.trabajadorActual.user,
            [singleResult.descriptor]
          );
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
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
  onSubmit(puntuacion: number = 0) {
    this.changeDetectorRef.detectChanges();
    if (!this.exam) return;
    if (this.trabajadorActual === null) return;
    this.exam.preguntas.forEach((pregunta, index) => {
      const selectedOption = this.userAnswers[index];
      const correctOption = pregunta.opciones.find(opcion => opcion.esCorrecta);

      if (selectedOption === correctOption?.texto) {
        puntuacion += pregunta.valor;
      }
    });

    const resultado: ResultadoDeEvaluacion = {
      ID_Trabajador: this.trabajadorActual.id as number,
      ID_Evaluacion: this.exam.id as number,
      Puntuacion: puntuacion
    };

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
    this.router.navigate(['/worker/examenes']).then(r => console.log(r)
    );

  }

  async loadModels(): Promise<void> {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models')
      ]);
      console.log('All models loaded successfully');
      this.isModelLoaded = true;
    } catch (err) {
      console.error('Error loading models:', err);
    }
  }
  startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.play();
        this.detectFaces();
      })
      .catch(err => {
        console.error("Error accessing the webcam: ", err);
      });
  }

  detectFaces() {
    if (!this.isModelLoaded) {
      console.error('Models not loaded yet. Cannot start face detection.');
      return;
    }
    const canvas = this.canvasElement.nativeElement;
    const video = this.videoElement.nativeElement;
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    video.addEventListener('play', () => {
      this.intervalId = window.setInterval(async () => {
        if (!this.labeledFaceDescriptors) {
          console.error('No labeled face descriptors available.');
          clearInterval(this.intervalId);
          return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
          console.error('Context is null.');
          clearInterval(this.intervalId);
          return;
        }
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });
        const detections = await faceapi.detectAllFaces(video, options).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        context.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);

        if (this.trabajadorActual) {
          const maxDescriptorDistance = 0.5;
          const faceMatcher = new faceapi.FaceMatcher([this.labeledFaceDescriptors], maxDescriptorDistance);
          resizedDetections.forEach((detection) => {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            if (bestMatch && bestMatch.distance < maxDescriptorDistance) {
              if (this.trabajadorActual && bestMatch.label === this.trabajadorActual.user) {
                this.failedAttempts = 0;
              }
            }else{
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No es la misma persona. Intento ' + this.failedAttempts + ' de 3.' });
              if (this.verificationActive) {
                this.failedAttempts++;
                if (this.failedAttempts >= 4) {
                  clearInterval(this.intervalId);
                  this.finishExamWithZero();
                }
              }
            }
          });
        }
      }, 5000);
    });
  }
/*
  async finishExamWithZero() {
    this.verificationActive = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Identidad no verificada. Terminando el examen con puntuación de cero.'
    });
    if (this.trabajadorActual && this.exam) {
      const nombreCompleto = this.trabajadorActual.name + ' ' + this.trabajadorActual.lastName;
      const cuerpoCorreo = `${nombreCompleto} ha tenido una suplantación en su examen de  ${this.exam.titulo}. Por lo tanto, se colocó 0 en su nota.`;

      try {
        const response = await this.http.post<any>('URL_DEL_BACKEND/enviar-correo', {
          destinatario: 'correo_destino@example.com',
          asunto: 'Suplantación en examen',
          cuerpo: cuerpoCorreo
        }).toPromise();
        console.log('Correo electrónico enviado:', response);

        setTimeout(() => {
          this.onSubmit(0);
        }, 3000);
      } catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
      }
    } else {
      console.error('Trabajador o examen no definidos');
    }
  }*/
  finishExamWithZero() {
    this.verificationActive = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Identidad no verificada. Terminando el examen con puntuación de cero.'
    });
    setTimeout(() => {
      this.onSubmit(0);
    }, 3000);
  }
}

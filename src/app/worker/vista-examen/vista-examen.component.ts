import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Evaluacion,ResultadoDeEvaluacion} from "../../interfaces/Evaluacion";
import {ActivatedRoute, Router} from "@angular/router";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {Trabajador} from "../../interfaces/Trabajador";
import {ResultadosService} from "../../services/resultados.service";
import {AuthService} from "../../core/services/auth.service";
import * as faceapi from 'face-api.js';
import {MessageService} from "primeng/api";
import emailjs from 'emailjs-com';

@Component({
  selector: 'app-vista-examen',
  templateUrl: './vista-examen.component.html',
  styleUrls: ['./vista-examen.component.css']
})
export class VistaExamenComponent implements OnInit, OnDestroy, AfterViewInit {
  exam: Evaluacion | undefined;
  trabajadorActual: Trabajador | null = null;
  userAnswers: { [key: number]: string } = {};
  currentQuestionIndex = 0;
  labeledFaceDescriptors: faceapi.LabeledFaceDescriptors | null = null;
  intervalId: number | undefined;
  private isModelLoaded: boolean | undefined;
  private failedNoFaceDetectedAttempts = 0;
  private failedIncorrectFaceDetectedAttempts = 0;
  private failedMultipleFacesDetectedAttempts = 0;
  tabSwitchCount: number = 0;
  private visibilityChangeHandler: (() => void) | undefined;

  errorMessage: string | null = null;

  private verificationActive = true;
  cameraLoaded = false;

  isPreviewVisible: boolean = true;

  showPreview(): void {
    this.isPreviewVisible = true;
  }

  startExam(): void {
    this.isPreviewVisible = false;
    this.ngOnInit();
  }

  onCameraLoad() {
    this.cameraLoaded = true;
    const videoElement = this.videoElement.nativeElement;
    videoElement.classList.add('loaded');
    const canvasElement = this.canvasElement.nativeElement;
    canvasElement.classList.add('loaded');
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluacionesService: EvaluacionesService,
    private resultadosService: ResultadosService,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private messageService: MessageService
  ) {

  }

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    setTimeout(() => {
      const cardElement = document.querySelector('.card');
      if (!cardElement) {
        return;
      }
      cardElement.classList.add('enter-active');
    }, 0);
  }
  private cleanupVisibilityChangeHandler(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = undefined;
    }
  }

  ngOnInit(): void {
    const examId = this.route.snapshot.params['id'];
    this.loadExam(examId);
    if (!this.isPreviewVisible) {
      const usuarioActual = this.authService.getCurrentUser();

      this.visibilityChangeHandler = () => {
        if (document.hidden) {
          this.tabSwitchCount++;
          if (this.tabSwitchCount < 3) {
            this.showWarningToast('Has cambiado de pestaña. Intento ' + this.tabSwitchCount + ' de 3.');
          } else {
            this.finishExamDueToTabSwitch();
          }
        }
      };
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);

      if (this.esTrabajador(usuarioActual)) {
        this.trabajadorActual = usuarioActual;
        this.loadModels().then(() => {
          this.createReferenceFaceDescriptor().then((isDescriptorCreated) => {
            if (isDescriptorCreated) {
              this.startVideo();
            } else {
              this.showError('La foto de su usuario no contiene un rostro para comparar.\n\n Comuniquese con el administrador para cambiar su foto.');
            }
          }).catch(e => {
            console.error(e);
            this.showError('Ocurrió un error al crear el descriptor facial.');
          });
        }).catch(error => {
          console.error("Error loading models:", error);
          this.showError('Ocurrió un error al cargar los modelos de reconocimiento facial.');
        });
      } else {
        this.showError('Usuario actual no es un trabajador o no está definido');
      }
    }
  }
  showWarningToast(message: string) {
    this.messageService.add({severity:'error', summary: 'Error', detail: message});
  }

  showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      sticky: false,
    });
    setTimeout(() => {
      this.router.navigate(['/worker/examenes']);
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.videoElement && this.videoElement.nativeElement.srcObject) {
      (this.videoElement.nativeElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  async createReferenceFaceDescriptor(): Promise<boolean> {
    if (this.trabajadorActual) {
      try {
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

  onSubmit(puntuacion: number = 0, estadoVerificacion: boolean = true) {
    this.changeDetectorRef.detectChanges();
    if (!this.exam) {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No hay un examen cargado.'});
      return;
    }
    if (this.trabajadorActual === null) {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No hay un trabajador activo.'});
      return;
    }
    this.exam.preguntas.forEach((pregunta, index) => {
      const selectedOption = this.userAnswers[index];
      const correctOption = pregunta.opciones.find(opcion => opcion.esCorrecta);
      if (selectedOption === correctOption?.texto) {
        puntuacion += pregunta.valor;
      }
    });
    if (this.trabajadorActual.id === undefined || this.exam.id === undefined) {
      console.error('ID de trabajador o evaluación no definido');
      return;
    }
    const resultado: ResultadoDeEvaluacion = {
      ID_Trabajador: this.trabajadorActual.id,
      ID_Evaluacion: this.exam.id,
      Puntuacion: puntuacion,
      estado_Verificacion: estadoVerificacion
    };

    this.resultadosService.submitEvaluacionResultado(resultado)
      .then(docRef => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Examen enviado correctamente.'
        });
        setTimeout(() => {
          this.router.navigate(['/worker/examenes']).then(r => console.log('Redireccionamiento exitoso', r));
        }, 2000);
      })
      .catch(error => {
        console.error('Error al enviar los resultados del examen:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al enviar',
          detail: 'Hubo un problema al enviar los resultados del examen.'
        });
      });
  }


  async loadModels(): Promise<void> {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models')
      ]);
      this.isModelLoaded = true;
    } catch (err) {
      console.error('Error loading models:', err);
    }
  }

  preprocessImage(image: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context) {
      canvas.width = image.videoWidth;
      canvas.height = image.videoHeight;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }


  startVideo() {
    navigator.mediaDevices.getUserMedia({video: {}})
      .then(stream => {
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.play().then(r => console.log(r));
        this.detectFaces();
      })
      .catch(err => {
        console.error("Error accessing the webcam: ", err);
      });
  }
  isCameraMinimized = false;

  toggleCamera() {
    this.isCameraMinimized = !this.isCameraMinimized;
  }
  goBack() {
    this.router.navigate(['/worker/examenes']);
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

        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        const preprocessedCanvas = this.preprocessImage(video);
        const detections = await faceapi.detectAllFaces(preprocessedCanvas, options)
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        context.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);

        if (detections.length === 0 || detections.length > 1) {
          if (detections.length === 0) {
            this.failedNoFaceDetectedAttempts++;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se detectó un rostro. Intento ' + this.failedNoFaceDetectedAttempts + ' de 3.'
            });
          } else if (detections.length > 1) {
            this.failedMultipleFacesDetectedAttempts++;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Se detectó más de un rostro en la cámara. Asegúrate de que solo haya una persona visible. Intento ' + this.failedMultipleFacesDetectedAttempts + ' de 3.'
            });
          }

          if (this.verificationActive && (this.failedNoFaceDetectedAttempts >= 3 || this.failedMultipleFacesDetectedAttempts >= 3)) {
            clearInterval(this.intervalId);
            this.finishExamWithZero();
          }
        } else {
          this.handleFaceMatch(resizedDetections);
        }
      }, 5000);
    });
  }

  handleFaceMatch(resizedDetections: any) {
    const maxDescriptorDistance = 0.65;
    const faceMatcher = new faceapi.FaceMatcher([this.labeledFaceDescriptors], maxDescriptorDistance);
    let faceMatched = false;

    resizedDetections.forEach((detection: any) => {
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      if (bestMatch && bestMatch.distance < maxDescriptorDistance && bestMatch.label === this.trabajadorActual?.user) {
        faceMatched = true;
      }
    });

    if (!faceMatched) {
      this.failedIncorrectFaceDetectedAttempts++;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No es la misma persona. Intento ' + this.failedIncorrectFaceDetectedAttempts + ' de 3.'
      });

      if (this.verificationActive && this.failedIncorrectFaceDetectedAttempts >= 3) {
        clearInterval(this.intervalId);
        this.finishExamWithZero();
      }
    } else {
      this.resetFaceDetectionCounters();
    }
  }
  resetFaceDetectionCounters() {
    this.failedNoFaceDetectedAttempts = 0;
    this.failedIncorrectFaceDetectedAttempts = 0;
    this.failedMultipleFacesDetectedAttempts = 0;
  }

  sendSecurityAlertEmail(trabajadorNombre: string, examenNombre: string) {
    const templateParams = {
      fecha_incidente: new Date().toLocaleString(),
      trabajador_nombre: trabajadorNombre,
      examen_nombre: examenNombre
    };

    emailjs.send('service_fx1m46t', 'template_ed6nlrw', templateParams, 't6DTaMMkS6zjoTBcQ')
      .then((response) => {
        console.log('Email successfully sent!', response.status, response.text);
      }, (error) => {
        console.error('Failed to send email:', error);
      });
  }

  finishExamWithZero() {
    this.verificationActive = false;
    this.cleanupVisibilityChangeHandler();

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Identidad no verificada. Terminando el examen con puntuación de cero.'
    });

    setTimeout(() => {
      this.onSubmit(0, false);
      if (this.trabajadorActual && this.exam) {
        this.sendSecurityAlertEmail(this.trabajadorActual.name, this.exam.titulo);
      } else {
        console.error('Trabajador o examen no definido');
      }
      window.location.reload();
    }, 3000);
  }
  finishExamDueToTabSwitch() {
    this.verificationActive = false;
    this.cleanupVisibilityChangeHandler();

    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Has cambiado de pestaña demasiadas veces. El examen se finalizará con una puntuación de cero.'
    });

    setTimeout(() => {
      this.onSubmit(0, false);
      if (this.trabajadorActual && this.exam) {
        this.sendSecurityAlertEmail(this.trabajadorActual.name, this.exam.titulo);
      } else {
        console.error('Trabajador o examen no definido');
      }
      window.location.reload();
    }, 3000);
  }
}

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
  isCameraMinimized = false;
  errorMessage: string | null = null;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  private verificationActive = true;
  cameraLoaded = false;
  areAlertsVisible: boolean = false;

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

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.videoElement && this.canvasElement) {
      } else {
        console.error('No se encontraron las referencias a videoElement o canvasElement.');
      }
    }, 1000);
  }

  clearToast() {
    this.messageService.clear();
    setTimeout(() => {
      this.areAlertsVisible = false;
    }, 2000);
  }

  ngOnInit(): void {
    const examId = this.route.snapshot.params['id'];
    this.loadExam(examId);
    const usuarioActual = this.authService.getCurrentUser();

    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.tabSwitchCount++;

        if (this.tabSwitchCount < 3) {
          this.showWarningToast(`Has cambiado de pestaña. Intento ${this.tabSwitchCount} de 3.`);
        } else {
          this.showWarningToast('Has cambiado de pestaña. Intento 3 de 3.');
          setTimeout(() => {
            this.finishExamDueToTabSwitch('Cambio de Pestaña');
          }, 2000);
        }
        this.areAlertsVisible = true;
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
      this.router.navigate(['/worker/examenes']).then(r =>console.log('Redireccionamiento exitoso', r));
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

  onSubmit(puntuacion: number = 0, estadoVerificacion: boolean = true, tipoDeError: string = '') {
    this.changeDetectorRef.detectChanges();
    if (!this.exam) {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No hay un examen cargado.'});
      return;
    }
    if (this.trabajadorActual === null) {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No hay un trabajador activo.'});
      return;
    }
    if (estadoVerificacion) {
      this.exam.preguntas.forEach((pregunta, index) => {
        const selectedOption = this.userAnswers[index];
        const correctOption = pregunta.opciones.find(opcion => opcion.esCorrecta);
        if (selectedOption === correctOption?.texto) {
          puntuacion += pregunta.valor;
        }
      });
    }
    if (this.trabajadorActual.id === undefined || this.exam.id === undefined) {
      console.error('ID de trabajador o evaluación no definido');
      return;
    }
    const resultado: ResultadoDeEvaluacion = {
      ID_Trabajador: this.trabajadorActual.id,
      ID_Evaluacion: this.exam.id,
      Puntuacion: puntuacion,
      estado_Verificacion: estadoVerificacion,
      tipoDeError
    };

    this.resultadosService.submitEvaluacionResultado(resultado)
      .then(docRef => {
        if (estadoVerificacion) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Examen enviado correctamente.'
          });
        }
        setTimeout(() => {
          this.router.navigate(['/worker/examenes']).then(r => console.log('Redireccionamiento exitoso', r));
        }, 1000);
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
        this.messageService.add({
          severity: 'error',
          summary: 'Cámara no disponible',
          detail: 'No se pudo acceder a la cámara. Asegúrate de que la cámara esté conectada y no esté siendo utilizada por otra aplicación.'
        });
      });
  }

  toggleCamera() {
    this.isCameraMinimized = !this.isCameraMinimized;
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
        //this.checkFaceMovement(resizedDetections);
        if (detections.length === 0) {
          this.failedNoFaceDetectedAttempts++;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se detectó un rostro. Intento ' + this.failedNoFaceDetectedAttempts + ' de 3.'
          });
          this.areAlertsVisible = true;

          if (this.verificationActive && this.failedNoFaceDetectedAttempts >= 3) {
            clearInterval(this.intervalId);
            this.finishExamWithZero('Rostro no detectado');
          }
        } else if (detections.length > 1) {
          this.failedMultipleFacesDetectedAttempts++;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Se detectó más de un rostro en la cámara. Asegúrate de que solo haya una persona visible. Intento ' + this.failedMultipleFacesDetectedAttempts + ' de 3.'
          });
          this.areAlertsVisible = true;

          if (this.verificationActive && this.failedMultipleFacesDetectedAttempts >= 3) {
            clearInterval(this.intervalId);
            this.finishExamWithZero('Más de un rostro detectado');
          }
        }
        else {
          this.handleFaceMatch(resizedDetections);
        }
      }, 4000);
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
      this.areAlertsVisible = true;

      if (this.verificationActive && this.failedIncorrectFaceDetectedAttempts >= 3) {
        clearInterval(this.intervalId);
        this.finishExamWithZero('Identidad no Verificada');
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

  finishExamWithZero(tipoDeError: string) {
    this.verificationActive = false;

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Identidad no verificada. Terminando el examen con puntuación de cero.'
    });
    this.areAlertsVisible = true;
    setTimeout(() => {
      this.onSubmit(0, false, tipoDeError);
      if (this.trabajadorActual && this.exam) {
        this.sendSecurityAlertEmail(this.trabajadorActual.name, this.exam.titulo);
      } else {
        console.error('Trabajador o examen no definido');
      }
      this.clearToast();
    }, 1000);
  }

  /*
  private movementDetectedCount = 0;
  private lastFaceCenter: { x: number; y: number } | null = null;
  private lastMovementTime: number | null = null;
  private readonly MOVEMENT_THRESHOLD = 5;
  private readonly MOVEMENT_COUNT_THRESHOLD = 3;
  private readonly MOVEMENT_DELAY_MS = 2000;
  private readonly EYE_BLINK_THRESHOLD = 0.2;

  private checkEyeBlink(detections: any): boolean {
    if (detections.length === 0) return false;

    const face = detections[0];
    const landmarks = face.landmarks;

    if (landmarks) {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const leftEyeBlinking = this.calculateEyeAspectRatio(leftEye) < this.EYE_BLINK_THRESHOLD;
      const rightEyeBlinking = this.calculateEyeAspectRatio(rightEye) < this.EYE_BLINK_THRESHOLD;

      return leftEyeBlinking || rightEyeBlinking;
    }
    return false;
  }
  private calculateEyeAspectRatio(eye: faceapi.Point[]): number {
    const A = this.calculateDistance(eye[1], eye[5]);
    const B = this.calculateDistance(eye[2], eye[4]);
    const C = this.calculateDistance(eye[0], eye[3]);

    return (A + B) / (2.0 * C);
  }

  private calculateDistance(p1: faceapi.Point, p2: faceapi.Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }
  checkFaceMovement(detections: any) {
    if (detections.length === 0) return;

    const face = detections[0];
    const { x, y, width, height } = face.detection.box;

    const faceCenter = {
      x: x + width / 2,
      y: y + height / 2
    };

    const currentTime = Date.now();

    if (this.lastFaceCenter) {
      const dx = Math.abs(faceCenter.x - this.lastFaceCenter.x);
      const dy = Math.abs(faceCenter.y - this.lastFaceCenter.y);

      if (dx <= this.MOVEMENT_THRESHOLD && dy <= this.MOVEMENT_THRESHOLD) {
        if (!this.checkEyeBlink(detections)) { // Verificar parpadeo
          if (!this.lastMovementTime || (currentTime - this.lastMovementTime) > this.MOVEMENT_DELAY_MS) {
            this.movementDetectedCount++;
            this.lastMovementTime = currentTime;

            if (this.movementDetectedCount <= this.MOVEMENT_COUNT_THRESHOLD) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: `No se detecta movimiento en la persona. Puede ser una imagen fija. Intento ${this.movementDetectedCount} de ${this.MOVEMENT_COUNT_THRESHOLD}.`
              });
            }

            if (this.movementDetectedCount >= this.MOVEMENT_COUNT_THRESHOLD) {
              this.finishExamWithZero();
              return;
            }
          }
        } else {
          this.movementDetectedCount = 0;
          this.lastMovementTime = null;
        }
      } else {
        this.movementDetectedCount = 0;
        this.lastMovementTime = null;
      }
    }
    this.lastFaceCenter = faceCenter;
  }
*/
  finishExamDueToTabSwitch(tipoDeError: string) {
    this.verificationActive = false;

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Has excedido el limite de intentos al cambiar de ventana. El examen se finalizará con una puntuación de cero.'
    });
    this.areAlertsVisible = true;

    setTimeout(() => {
      this.onSubmit(0, false, tipoDeError);
      if (this.trabajadorActual && this.exam) {
        this.sendSecurityAlertEmail(this.trabajadorActual.name, this.exam.titulo);
      } else {
        console.error('Trabajador o examen no definido');
      }
      this.clearToast();
    }, 2000);
  }
  allQuestionsAnswered(): boolean {
    return this.exam?.preguntas.every((_, index) => this.userAnswers[index]) ?? false;
  }

}

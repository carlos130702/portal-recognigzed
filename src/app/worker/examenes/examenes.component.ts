import {Component, OnInit} from '@angular/core';
import {Evaluacion, ResultadoDeEvaluacion} from "../../interfaces/Evaluacion";
import {EvaluacionesService} from "../../services/evaluaciones.service";
import {Router} from "@angular/router";
import {catchError} from "rxjs/operators";
import {throwError} from "rxjs";
import {ResultadosService} from "../../services/resultados.service";
import {AuthService} from "../../core/services/auth.service";

@Component({
  selector: 'app-examenes',
  templateUrl: './examenes.component.html',
  styleUrl: './examenes.component.css'
})
export class ExamenesComponent implements OnInit {
  evaluaciones: Evaluacion[] = [];
  resultadosEvaluaciones: ResultadoDeEvaluacion[] = [];
  idUsuarioActual: number | undefined;

  constructor(
    private evaluacionesService: EvaluacionesService,
    private resultadosService: ResultadosService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEvaluaciones();
    const usuario = this.authService.getCurrentUser();
    if (usuario) {
      this.idUsuarioActual = usuario.id;
      this.cargarResultados();
    } else {
    }
  }

  loadEvaluaciones(): void {
    this.evaluacionesService.getEvaluaciones()
      .pipe(
        catchError((error) => {
          console.error('Error fetching evaluations', error);
          return throwError(error);
        })
      )
      .subscribe(
        (data) => {
          this.evaluaciones = data;
        }
      );
  }


  rendirEvaluacion(examId: string): void {
    this.router.navigate(['/worker/evaluaciones', examId]).then(r => console.log(r)
    );
  }
  cargarResultados(): void {
    this.resultadosService.getEvaluacionResultados().subscribe(resultados => {
      this.resultadosEvaluaciones = resultados.filter(resultado => {
        if(this.idUsuarioActual === undefined) { return false; }
        const esElUsuario = resultado.ID_Trabajador.toString() === this.idUsuarioActual.toString();
        return esElUsuario;
      });
    });
  }


  obtenerCalificacion(idEvaluacion: number): number | null {
    const resultado = this.resultadosEvaluaciones.find(resultado => resultado.ID_Evaluacion === idEvaluacion);
    return resultado ? resultado.Puntuacion : null;
  }


  tieneCalificacion(idEvaluacion: number): boolean {
    return this.obtenerCalificacion(idEvaluacion) !== null;
  }

}

import { Injectable } from '@angular/core';
import {Evaluacion} from "../interfaces/Evaluacion";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private apiUrl = 'http://localhost:3000/evaluaciones';

  constructor(private http: HttpClient) { }

  // Obtener todas las evaluaciones con sus preguntas y opciones
  getEvaluaciones(): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(this.apiUrl);
  }

  // Obtener una evaluación específica por ID
  getEvaluacionById(id: string): Observable<Evaluacion> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Evaluacion>(url);
  }

  // Añadir una nueva evaluación

  addEvaluacion(evaluacion: Evaluacion): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(this.apiUrl, evaluacion);
  }

  addEvaluacionSinPreguntas(evaluacion: { descripcion: string; titulo: string }): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(this.apiUrl, evaluacion);
  }

  // Actualizar una evaluación existente
  updateEvaluacion(evaluacion: Evaluacion): Observable<Evaluacion> {
    const url = `${this.apiUrl}/${evaluacion.id}`;
    return this.http.put<Evaluacion>(url, evaluacion);
  }

  // Eliminar una evaluación
  deleteEvaluacion(id: number | undefined): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url);
  }
}

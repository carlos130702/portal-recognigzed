import {Injectable} from '@angular/core';
import {Evaluacion} from "../interfaces/Evaluacion";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private apiUrl = 'http://localhost:3000/evaluaciones';

  constructor(private http: HttpClient) {
  }

  getEvaluaciones(): Observable<Evaluacion[]> {
    const url = `${this.apiUrl}`;
    return this.http.get<Evaluacion[]>(url);
  }

  getEvaluacionById(id: string): Observable<Evaluacion> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Evaluacion>(url);
  }

  addEvaluacion(evaluacion: Evaluacion): Observable<Evaluacion> {
    return this.http.post<Evaluacion>(this.apiUrl, evaluacion);
  }

  actualizarEvaluacion(evaluacion: Evaluacion) {
    const url = `${this.apiUrl}/${evaluacion.id}`;
    return this.http.put(url, evaluacion);
  }

  deleteEvaluacion(id: number | undefined): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url);
  }
}

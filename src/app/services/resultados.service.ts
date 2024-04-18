import { Injectable } from '@angular/core';
import {ResultadoDeEvaluacion} from "../interfaces/Evaluacion";
import {Observable} from "rxjs";
import {HttpClient, HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ResultadosService {
  private apiUrl = 'http://localhost:3000/resultadosDeEvaluacion';

  constructor(private http: HttpClient) { }

  // Method to submit the evaluation result
  submitEvaluacionResultado(resultado: ResultadoDeEvaluacion): Observable<ResultadoDeEvaluacion> {
    // Here, we post the resultado to the backend
    return this.http.post<ResultadoDeEvaluacion>(this.apiUrl, resultado);
  }


  getEvaluacionResultados(): Observable<ResultadoDeEvaluacion[]> {
    return this.http.get<ResultadoDeEvaluacion[]>(this.apiUrl);
  }

  getEvaluacionResultadoById(id: string): Observable<ResultadoDeEvaluacion[]> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<ResultadoDeEvaluacion[]>(url);
  }

  getEvaluacionResultadosDeTrabajador(idTrabajador: string): Observable<ResultadoDeEvaluacion[]> {
    const params = new HttpParams().set('ID_Trabajador', idTrabajador);
    return this.http.get<ResultadoDeEvaluacion[]>(`${this.apiUrl}`, { params });
  }

  // Update an evaluation result
  updateEvaluacionResultado(resultado: ResultadoDeEvaluacion): Observable<ResultadoDeEvaluacion> {
    const url = `${this.apiUrl}/${resultado.id}`;
    return this.http.put<ResultadoDeEvaluacion>(url, resultado);
  }

  // Delete an evaluation result
  deleteEvaluacionResultado(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url);
  }
}

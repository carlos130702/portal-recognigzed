import {Injectable} from '@angular/core';
import {ResultadoDeEvaluacion} from "../interfaces/Evaluacion";
import {Observable} from "rxjs";
import {HttpClient, HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ResultadosService {
  private apiUrl = 'http://localhost:3000/resultadosDeEvaluacion';

  constructor(private http: HttpClient) {
  }

  submitEvaluacionResultado(resultado: ResultadoDeEvaluacion): Observable<ResultadoDeEvaluacion> {
    return this.http.post<ResultadoDeEvaluacion>(this.apiUrl, resultado);
  }


  getEvaluacionResultados(): Observable<ResultadoDeEvaluacion[]> {
    return this.http.get<ResultadoDeEvaluacion[]>(this.apiUrl);
  }

  getEvaluacionResultadosDeTrabajador(idTrabajador: string): Observable<ResultadoDeEvaluacion[]> {
    const params = new HttpParams().set('ID_Trabajador', idTrabajador);
    return this.http.get<ResultadoDeEvaluacion[]>(`${this.apiUrl}`, {params});
  }
}

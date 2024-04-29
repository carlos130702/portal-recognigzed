import {Injectable} from '@angular/core';
import {Trabajador} from "../interfaces/Trabajador";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class TrabajadoresService {
  private apiUrl = 'http://localhost:3000/trabajadores';

  constructor(private http: HttpClient) {
  }

  getTrabajadores(): Observable<Trabajador[]> {
    return this.http.get<Trabajador[]>(this.apiUrl);
  }

  addTrabajador(trabajador: Omit<Trabajador, 'id'>): Observable<Trabajador> {
    return this.http.post<Trabajador>(this.apiUrl, trabajador);
  }

  editarTrabajador(trabajador: Trabajador): Observable<Trabajador> {
    const url = `${this.apiUrl}/${trabajador.id}`;
    return this.http.put<Trabajador>(url, trabajador);
  }

  eliminarTrabajador(id: number | undefined): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url);
  }
}

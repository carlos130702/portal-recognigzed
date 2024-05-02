import {Injectable} from '@angular/core';
import {Evaluacion, Pregunta} from "../interfaces/Evaluacion";
import {Observable, tap} from "rxjs";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {map} from "rxjs/operators";
import firebase from "firebase/compat";
import {Trabajador} from "../interfaces/Trabajador";

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private collectionPath = 'evaluaciones';

  constructor(private firestore: AngularFirestore) {
  }

  getEvaluaciones(): Observable<Evaluacion[]> {
    return this.firestore.collection<Evaluacion>(this.collectionPath).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Evaluacion;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  getEvaluacionById(id: string): Observable<Evaluacion> {
    return this.firestore.doc<Evaluacion>(`${this.collectionPath}/${id}`).snapshotChanges().pipe(
      map(a => {
        const data = a.payload.data() as Evaluacion;
        const id = a.payload.id;
        return { id, ...data };
      })
    );
  }

  async addEvaluacion(evaluacion: Evaluacion): Promise<Evaluacion> {
    const docRef = await this.firestore.collection<Evaluacion>(this.collectionPath).add(evaluacion);
    const docSnapshot = await docRef.get();
    if (docSnapshot.exists) {
      return {id: docSnapshot.id, ...docSnapshot.data() as Evaluacion};
    } else {
      throw new Error('No se encontró el documento después de crearlo.');
    }
  }


  deleteEvaluacion(id: string): Promise<void> {
    return this.firestore.doc(`${this.collectionPath}/${id}`).delete();
  }
  actualizarEvaluacion(evaluacion: Evaluacion) {
    return this.firestore.doc<Trabajador>(`${this.collectionPath}/${evaluacion.id}`).update(evaluacion);
  }

  checkTituloUnico(titulo: string): Observable<boolean> {
    return this.firestore.collection<Evaluacion>(this.collectionPath, ref =>
      ref.where('titulo', '==', titulo.toLowerCase())
    ).snapshotChanges().pipe(
      map(changes => changes.length === 0)
    );
  }

}

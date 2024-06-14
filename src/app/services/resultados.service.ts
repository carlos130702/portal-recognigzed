import {Injectable} from '@angular/core';
import {ResultadoDeEvaluacion} from "../interfaces/Evaluacion";
import {Observable} from "rxjs";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import firebase from "firebase/compat";
import DocumentReference = firebase.firestore.DocumentReference;
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ResultadosService {
  private collectionPath = 'resultadosDeEvaluacion';

  constructor(private firestore: AngularFirestore) {
  }

  submitEvaluacionResultado(resultado: ResultadoDeEvaluacion): Promise<DocumentReference<ResultadoDeEvaluacion>> {
    return this.firestore.collection<ResultadoDeEvaluacion>(this.collectionPath).add(resultado);
  }

  getEvaluacionResultados(): Observable<ResultadoDeEvaluacion[]> {
    return this.firestore.collection<ResultadoDeEvaluacion>(this.collectionPath).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as ResultadoDeEvaluacion;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  getEvaluacionResultadosDeTrabajador(idTrabajador: string): Observable<ResultadoDeEvaluacion[]> {
    return this.firestore.collection<ResultadoDeEvaluacion>(this.collectionPath, ref => ref.where('ID_Trabajador', '==', idTrabajador)).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as ResultadoDeEvaluacion;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
  deleteEvaluacionResultado(id: string): Promise<void> {
    return this.firestore.collection(this.collectionPath).doc(id).delete();
  }
}

import {Injectable} from '@angular/core';
import {Trabajador} from "../interfaces/Trabajador";
import {last, Observable, switchMap, throwError} from "rxjs";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {catchError, map} from "rxjs/operators";
import firebase from "firebase/compat";
import DocumentReference = firebase.firestore.DocumentReference;
import {AngularFireStorage} from "@angular/fire/compat/storage";
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TrabajadoresService {
  private collectionPath = 'trabajadores';

  constructor(private firestore: AngularFirestore,private storage: AngularFireStorage) {
  }

  getTrabajadores(): Observable<Trabajador[]> {
    return this.firestore.collection<Trabajador>(this.collectionPath).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Trabajador;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
  uploadFile(file: File): Observable<string> {
    const filePath = `trabajadores/${Date.now()}_${file.name}`;
    const ref = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);
    return task.snapshotChanges().pipe(
      last(),
      switchMap(() => ref.getDownloadURL()),
      catchError(error => {
        console.error('Error en la carga:', error);
        return throwError(error);
      })
    );
  }

  addTrabajador(trabajador: Omit<Trabajador, 'id'>): Promise<DocumentReference<Trabajador>> {
    return this.firestore.collection<Trabajador>(this.collectionPath).add(trabajador);
  }

  checkIfUserExists(user: string): Observable<boolean> {
    return this.firestore.collection<Trabajador>(this.collectionPath, ref => ref.where('user', '==', user)).valueChanges().pipe(
      map(users => users.length > 0)
    );
  }

  editarTrabajador(trabajador: Trabajador): Promise<void> {
    return this.firestore.doc<Trabajador>(`${this.collectionPath}/${trabajador.id}`).update(trabajador);
  }

  eliminarTrabajador(id: string | undefined): Promise<void> {
    return this.firestore.doc(`${this.collectionPath}/${id}`).delete();
  }
}

export interface Evaluacion {
  id?: number;
  titulo: string;
  descripcion: string;
  preguntas: Pregunta[];
}

export interface Pregunta {
  id?: number;
  enunciado: string;
  opciones: Opcion[];
  valor: number;
}

export interface Opcion {
  id?: number;
  texto: string;
  esCorrecta: boolean;
}

export interface ResultadoDeEvaluacion {
  id?: number;
  ID_Trabajador: number;
  ID_Evaluacion: number;
  Puntuacion: number;
}

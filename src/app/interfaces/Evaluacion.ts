export interface Evaluacion {
  id?: string;
  titulo: string;
  descripcion: string;
  preguntas: Pregunta[];
  numOpciones: number;
}

export interface Pregunta {
  id?: string;
  enunciado: string;
  opciones: Opcion[];
  valor: number;
}

export interface Opcion {
  id?: string;
  texto: string;
  esCorrecta: boolean;
}

export interface ResultadoDeEvaluacion {
  id?: string;
  ID_Trabajador: string;
  ID_Evaluacion: string;
  Puntuacion: number;
  estado_Verificacion: boolean;
  tipoDeError?: string;
}

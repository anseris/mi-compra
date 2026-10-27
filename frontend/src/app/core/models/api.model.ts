/** Respuesta genérica del backend para mensajes (delete, errores 4xx/5xx). */
export interface ApiMensaje {
  mensaje: string;
  eliminados?: number;
}

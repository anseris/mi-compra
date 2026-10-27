import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae un mensaje legible de un error HTTP del backend.
 * El backend responde siempre con `{ mensaje: string }`.
 */
export function mensajeError(error: unknown, porDefecto: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Comprueba que el backend esté arrancado.';
    }

    const mensaje = (error.error as { mensaje?: string } | null)?.mensaje;

    if (mensaje) {
      return mensaje;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return porDefecto;
}

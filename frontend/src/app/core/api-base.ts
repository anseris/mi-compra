/**
 * URL base de la API.
 *
 * En desarrollo se usa el backend local (puerto 3000) tanto si se abre la app
 * como `localhost` como `127.0.0.1`. En producción se asume que el frontend y
 * la API se sirven bajo el mismo dominio en `/api`.
 */
function esEntornoLocal(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname;

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

export const API_BASE = esEntornoLocal()
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`;

/**
 * URL base de la API.
 *
 * En desarrollo se usa el backend local (puerto 3000) tanto si se abre la app
 * como `localhost` como `127.0.0.1`. En producción se puede proporcionar el
 * host de la API mediante runtime-config.js; si no, se usa el mismo dominio.
 */
declare global {
  interface Window {
    __MI_COMPRA_CONFIG__?: {
      apiHost?: string;
    };
  }
}

function esEntornoLocal(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname;

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function obtenerApiProduccion(): string {
  const apiHost = window.__MI_COMPRA_CONFIG__?.apiHost?.trim();

  if (!apiHost) {
    return `${window.location.origin}/api`;
  }

  const origen = /^https?:\/\//i.test(apiHost) ? apiHost : `https://${apiHost}`;
  return `${origen.replace(/\/+$/, "")}/api`;
}

export const API_BASE = esEntornoLocal()
  ? "http://localhost:3000/api"
  : "https://mi-compra.onrender.com/api";

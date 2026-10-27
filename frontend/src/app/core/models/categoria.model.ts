/** Documento tal y como lo devuelve el backend (colección `categorias`). */
export interface Categoria {
  _id: string;
  nombre: string;
  /** Emoji que representa la categoría (p. ej. '🥑'). */
  icono: string;
  /** Color en formato hexadecimal. Cadena vacía = sin color. */
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Cuerpo para crear una categoría (POST). */
export interface CrearCategoria {
  nombre: string;
  icono?: string;
  color?: string;
}

/** Cuerpo para modificar una categoría (PUT): todos los campos son opcionales. */
export type ActualizarCategoria = Partial<CrearCategoria>;

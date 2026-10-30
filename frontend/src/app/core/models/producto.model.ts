/** Documento tal y como lo devuelve el backend (colección `productos`). */
export interface Producto {
  _id: string;
  nombre: string;
  precio: number;
  /** Id de la categoría a la que pertenece el producto. */
  categoria: string;
  /** Id de la sección del supermercado. */
  seccion?: string | null;
  /** Subsección dentro de la sección, si corresponde. */
  subseccion?: string;
  /** Orden de parada en la ruta del supermercado, entre 1 y 19. */
  r?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Cuerpo para crear un producto (POST). */
export interface CrearProducto {
  nombre: string;
  precio: number;
  categoria: string;
  seccion: string;
  subseccion?: string;
  r?: number | null;
}

/** Cuerpo para modificar un producto (PUT): todos los campos son opcionales. */
export type ActualizarProducto = Partial<CrearProducto>;

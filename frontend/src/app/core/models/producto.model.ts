/** Documento tal y como lo devuelve el backend (colección `productos`). */
export interface Producto {
  _id: string;
  nombre: string;
  precio: number;
  /** Id de la categoría a la que pertenece el producto. */
  categoria: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Cuerpo para crear un producto (POST). */
export interface CrearProducto {
  nombre: string;
  precio: number;
  categoria: string;
}

/** Cuerpo para modificar un producto (PUT): todos los campos son opcionales. */
export type ActualizarProducto = Partial<CrearProducto>;

/** Artículo de la lista de la compra (colección `lista_compra`). */
export interface ItemLista {
  _id: string;
  listaId: string;
  /** Producto del catálogo del que se copió el artículo. */
  productoId: string | null;
  categoriaId: string | null;
  nombre: string;
  precio: number;
  categoriaNombre: string;
  categoriaIcono: string;
  cantidad: number;
  comprado: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Cuerpo para añadir un producto del catálogo a la lista (POST). */
export interface CrearItemLista {
  productoId: string;
  listaId?: string;
  cantidad?: number;
}

/** Cuerpo para modificar un artículo de la lista (PATCH). */
export interface ActualizarItemLista {
  cantidad?: number;
  comprado?: boolean;
}

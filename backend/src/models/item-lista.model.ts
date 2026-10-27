import { Schema, model, type Types } from 'mongoose';

export interface IItemLista {
  _id: string;
  listaId: Types.ObjectId | null;
  /** Producto del catálogo del que se copió el artículo (null si es manual). */
  productoId: Types.ObjectId | null;
  /** Categoría del producto (null si es manual). */
  categoriaId: Types.ObjectId | null;
  /** Datos copiados del producto en el momento de añadirlo a la lista. */
  nombre: string;
  precio: number;
  categoriaNombre: string;
  categoriaIcono: string;
  cantidad: number;
  comprado: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const itemListaSchema = new Schema<IItemLista>(
  {
    listaId: {
      type: Schema.Types.ObjectId,
      ref: 'ListaCompra',
      default: null,
    },
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      default: null,
    },
    categoriaId: {
      type: Schema.Types.ObjectId,
      ref: 'Categoria',
      default: null,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    categoriaNombre: {
      type: String,
      trim: true,
      default: '',
    },
    categoriaIcono: {
      type: String,
      trim: true,
      default: '🛍️',
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    comprado: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'lista_compra',
  },
);

itemListaSchema.index({ comprado: 1 });
itemListaSchema.index({ productoId: 1 });
itemListaSchema.index({ listaId: 1, comprado: 1 });

export const ItemLista = model<IItemLista>('ItemLista', itemListaSchema);

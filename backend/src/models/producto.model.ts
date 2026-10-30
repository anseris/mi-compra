import { Schema, model, type Types } from 'mongoose';

export interface IProducto {
  _id: string;
  nombre: string;
  precio: number;
  /** Id de la categoría a la que pertenece el producto. */
  categoria: Types.ObjectId;
  /** Sección física del supermercado. */
  seccion: Types.ObjectId | null;
  /** Subsección dentro de la sección, si corresponde. */
  subseccion: string;
  /** Orden de parada en la ruta del supermercado. */
  r: number | null;
  favorito: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const productoSchema = new Schema<IProducto>(
  {
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
    categoria: {
      type: Schema.Types.ObjectId,
      ref: 'Categoria',
      required: true,
    },
    seccion: {
      type: Schema.Types.ObjectId,
      ref: 'Seccion',
      default: null,
    },
    subseccion: {
      type: String,
      trim: true,
      default: '',
    },
    r: {
      type: Number,
      min: 1,
      max: 19,
      default: null,
    },
    favorito: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'productos',
  },
);

productoSchema.index({ nombre: 1 });
productoSchema.index({ categoria: 1 });
productoSchema.index({ seccion: 1, subseccion: 1 });

export const Producto = model<IProducto>('Producto', productoSchema);

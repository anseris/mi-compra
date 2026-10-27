import { Schema, model, type Types } from 'mongoose';

export interface IProducto {
  _id: string;
  nombre: string;
  precio: number;
  /** Id de la categoría a la que pertenece el producto. */
  categoria: Types.ObjectId;
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
  },
  {
    timestamps: true,
    collection: 'productos',
  },
);

productoSchema.index({ nombre: 1 });
productoSchema.index({ categoria: 1 });

export const Producto = model<IProducto>('Producto', productoSchema);

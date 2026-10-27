import { Schema, model } from 'mongoose';

export interface IListaCompra {
  _id: string;
  nombre: string;
  predeterminada: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const listaCompraSchema = new Schema<IListaCompra>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    predeterminada: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: 'listas_compra' },
);

listaCompraSchema.index(
  { predeterminada: 1 },
  { unique: true, partialFilterExpression: { predeterminada: true } },
);

export const ListaCompra = model<IListaCompra>('ListaCompra', listaCompraSchema);

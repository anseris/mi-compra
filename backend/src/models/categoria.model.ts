import { Schema, model } from 'mongoose';

export interface ICategoria {
  _id: string;
  nombre: string;
  /** Emoji que representa la categoría (p. ej. '🥑'). */
  icono: string;
  /** Color en formato hexadecimal (p. ej. '#22C55E'). Cadena vacía = sin color. */
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const categoriaSchema = new Schema<ICategoria>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    icono: {
      type: String,
      trim: true,
      default: '🛍️',
      maxlength: 8,
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'categorias',
  },
);

// El nombre de la categoría es único dentro del catálogo.
categoriaSchema.index({ nombre: 1 }, { unique: true });

export const Categoria = model<ICategoria>('Categoria', categoriaSchema);

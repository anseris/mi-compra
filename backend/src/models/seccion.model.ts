import { Schema, model } from 'mongoose';

export interface ISeccion {
  _id: string;
  nombre: string;
  subsecciones: string[];
  orden: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export function normalizarNombreSeccion(nombre: string): string {
  return nombre.trim().toLocaleLowerCase('es');
}

const seccionSchema = new Schema<ISeccion>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    subsecciones: {
      type: [String],
      default: [],
    },
    orden: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'secciones',
  },
);

seccionSchema.index({ nombre: 1 }, { unique: true });

export const Seccion = model<ISeccion>('Seccion', seccionSchema);

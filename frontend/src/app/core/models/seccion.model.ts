export interface Seccion {
  _id: string;
  nombre: string;
  subsecciones: string[];
  orden: number;
  createdAt?: string;
  updatedAt?: string;
}

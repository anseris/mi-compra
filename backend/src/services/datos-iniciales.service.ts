import { Categoria } from "../models/categoria.model.js";
import { Producto } from "../models/producto.model.js";
import { Seccion } from "../models/seccion.model.js";

/**
 * Categorías que se crean automáticamente la primera vez que se arranca la API.
 * Así la aplicación es utilizable desde el primer momento.
 */
export const CATEGORIAS_POR_DEFECTO = [
  { nombre: "Fruta y verdura", icono: "🥑", color: "#22C55E" },
  { nombre: "Carne y pescado", icono: "🐟", color: "#EF4444" },
  { nombre: "Lácteos", icono: "🥛", color: "#3B82F6" },
  { nombre: "Panadería", icono: "🥖", color: "#F59E0B" },
  { nombre: "Despensa", icono: "🥫", color: "#8B5CF6" },
  { nombre: "Bebidas", icono: "🧃", color: "#06B6D4" },
  { nombre: "Limpieza", icono: "🧽", color: "#14B8A6" },
  { nombre: "Higiene", icono: "🧴", color: "#EC4899" },
  { nombre: "Otros", icono: "🛒", color: "#6B7280" },
] as const;

export const SECCIONES_POR_DEFECTO = [
  { nombre: "Entrada", subsecciones: ["E1", "E2", "E3", "E4", "E5"] },
  { nombre: "Centro", subsecciones: ["C1", "C2", "C3", "C4", "C5"] },
  { nombre: "Fondo", subsecciones: ["F1"] },
  { nombre: "Frutería", subsecciones: [] },
  { nombre: "Verduras", subsecciones: [] },
  { nombre: "Quesos", subsecciones: [] },
  { nombre: "Envasados", subsecciones: [] },
  { nombre: "Congelados", subsecciones: [] },
  { nombre: "Panadería", subsecciones: [] },
  { nombre: "Pescadería", subsecciones: [] },
  { nombre: "Carnicería", subsecciones: [] },
  { nombre: "Charcutería", subsecciones: [] },
] as const;

/** Crea las categorías base si todavía no existe ninguna. */
export async function crearCategoriasPorDefecto(): Promise<void> {
  const existe = await Categoria.exists({});

  if (existe) {
    return;
  }

  await Categoria.insertMany(
    CATEGORIAS_POR_DEFECTO.map((categoria) => ({ ...categoria })),
  );
}

/** Inserta o actualiza las secciones iniciales sin sobrescribir datos propios. */
export async function crearSeccionesPorDefecto(): Promise<void> {
  await Seccion.bulkWrite(
    SECCIONES_POR_DEFECTO.map((seccion, orden) => ({
      updateOne: {
        filter: { nombre: seccion.nombre },
        update: {
          $setOnInsert: {
            nombre: seccion.nombre,
            subsecciones: [...seccion.subsecciones],
            orden,
          },
        },
        upsert: true,
      },
    })),
  );
}

/** Completa el nuevo campo favorito en productos antiguos sin sobrescribir preferencias. */
export async function completarFavoritoProductosExistentes(): Promise<void> {
  await Producto.updateMany(
    { favorito: { $exists: false } },
    { $set: { favorito: false } },
  );
}

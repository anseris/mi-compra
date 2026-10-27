import { Categoria } from '../models/categoria.model.js';

/**
 * Categorías que se crean automáticamente la primera vez que se arranca la API.
 * Así la aplicación es utilizable desde el primer momento.
 */
export const CATEGORIAS_POR_DEFECTO = [
  { nombre: 'Fruta y verdura', icono: '🥑', color: '#22C55E' },
  { nombre: 'Carne y pescado', icono: '🐟', color: '#EF4444' },
  { nombre: 'Lácteos', icono: '🥛', color: '#3B82F6' },
  { nombre: 'Panadería', icono: '🥖', color: '#F59E0B' },
  { nombre: 'Despensa', icono: '🥫', color: '#8B5CF6' },
  { nombre: 'Bebidas', icono: '🧃', color: '#06B6D4' },
  { nombre: 'Limpieza', icono: '🧽', color: '#14B8A6' },
  { nombre: 'Higiene', icono: '🧴', color: '#EC4899' },
  { nombre: 'Otros', icono: '🛒', color: '#6B7280' },
] as const;

/** Crea las categorías base si todavía no existe ninguna. */
export async function crearCategoriasPorDefecto(): Promise<void> {
  const existe = await Categoria.exists({});

  if (existe) {
    return;
  }

  await Categoria.insertMany(CATEGORIAS_POR_DEFECTO.map((categoria) => ({ ...categoria })));
}

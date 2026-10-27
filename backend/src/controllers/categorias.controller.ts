import type { Request, Response } from 'express';
import { Categoria } from '../models/categoria.model.js';
import { ItemLista } from '../models/item-lista.model.js';
import { Producto } from '../models/producto.model.js';

/** Detecta el error de índice único de MongoDB (nombre duplicado). */
const esNombreDuplicado = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: number }).code === 11000;

function nombreValido(value: unknown): string | null {
  const nombre = String(value ?? '').trim();
  return nombre.length > 0 && nombre.length <= 40 ? nombre : null;
}

// GET /api/categorias — listar las categorías
export const getCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await Categoria.find().sort({ nombre: 1 });
    res.status(200).json(categorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar las categorías.' });
  }
};

// GET /api/categorias/:id — obtener una categoría
export const getCategoriaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoria = await Categoria.findById(req.params['id']);

    if (!categoria) {
      res.status(404).json({ mensaje: 'Categoría no encontrada.' });
      return;
    }

    res.status(200).json(categoria);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'Id de categoría no válido.' });
  }
};

// POST /api/categorias — crear una categoría
export const createCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const nombre = nombreValido(req.body?.nombre);

    if (!nombre) {
      res.status(400).json({ mensaje: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    const categoria = await Categoria.create({
      nombre,
      icono: String(req.body?.icono ?? '🛍️').trim() || '🛍️',
      color: String(req.body?.color ?? '').trim(),
    });

    res.status(201).json(categoria);
  } catch (error) {
    if (esNombreDuplicado(error)) {
      res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre.' });
      return;
    }

    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo crear la categoría.' });
  }
};

// PUT /api/categorias/:id — modificar una categoría
export const updateCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const cambios: Record<string, unknown> = {};

    if (req.body?.nombre !== undefined) {
      const nombre = nombreValido(req.body.nombre);

      if (!nombre) {
        res.status(400).json({ mensaje: 'El nombre de la categoría no es válido.' });
        return;
      }

      cambios['nombre'] = nombre;
    }

    if (req.body?.icono !== undefined) {
      cambios['icono'] = String(req.body.icono).trim() || '🛍️';
    }

    if (req.body?.color !== undefined) {
      cambios['color'] = String(req.body.color).trim();
    }

    const categoria = await Categoria.findOneAndUpdate(
      { _id: req.params['id'] },
      cambios,
      { returnDocument: 'after', runValidators: true },
    );

    if (!categoria) {
      res.status(404).json({ mensaje: 'Categoría no encontrada.' });
      return;
    }

    // La lista guarda una copia del nombre y el icono para mostrarlos sin joins.
    await ItemLista.updateMany(
      { categoriaId: categoria._id },
      {
        $set: {
          categoriaNombre: categoria.nombre,
          categoriaIcono: categoria.icono,
        },
      },
    );

    res.status(200).json(categoria);
  } catch (error) {
    if (esNombreDuplicado(error)) {
      res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre.' });
      return;
    }

    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo modificar la categoría.' });
  }
};

// DELETE /api/categorias/:id — eliminar una categoría
export const deleteCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const enUso = await Producto.exists({ categoria: req.params['id'] });

    if (enUso) {
      res.status(409).json({
        mensaje: 'No puedes eliminar una categoría que todavía tiene productos.',
      });
      return;
    }

    const categoria = await Categoria.findOneAndDelete({ _id: req.params['id'] });

    if (!categoria) {
      res.status(404).json({ mensaje: 'Categoría no encontrada.' });
      return;
    }

    res.status(200).json({ mensaje: 'Categoría eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo eliminar la categoría.' });
  }
};

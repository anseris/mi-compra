import type { Request, Response } from 'express';
import { Categoria } from '../models/categoria.model.js';
import { ItemLista } from '../models/item-lista.model.js';
import { Producto } from '../models/producto.model.js';
import { obtenerListaCompra } from '../services/listas-compra.service.js';

function cantidadValida(value: unknown): number | null {
  const cantidad = Math.floor(Number(value));
  return Number.isFinite(cantidad) && cantidad >= 1 ? cantidad : null;
}

// GET /api/lista — listar la lista de la compra
export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const lista = await obtenerListaCompra(String(req.query['listaId'] ?? '').trim());

    if (!lista) {
      res.status(404).json({ mensaje: 'Lista no encontrada.' });
      return;
    }

    const items = await ItemLista.find({ listaId: lista._id }).sort({ createdAt: 1 });
    res.status(200).json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar la lista de la compra.' });
  }
};

// POST /api/lista — añadir un producto del catálogo a la lista
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const productoId = String(req.body?.productoId ?? '').trim();
    const cantidad = cantidadValida(req.body?.cantidad ?? 1);
    const listaId = String(req.body?.listaId ?? '').trim();

    if (!productoId) {
      res.status(400).json({ mensaje: 'Indica el producto que quieres añadir.' });
      return;
    }

    if (cantidad === null) {
      res.status(400).json({ mensaje: 'La cantidad debe ser un número mayor que cero.' });
      return;
    }

    const lista = await obtenerListaCompra(listaId || undefined);

    if (!lista) {
      res.status(404).json({ mensaje: 'Lista no encontrada.' });
      return;
    }

    const producto = await Producto.findById(productoId);

    if (!producto) {
      res.status(404).json({ mensaje: 'Producto no encontrado.' });
      return;
    }

    // Si ya está pendiente, solo se aumenta la cantidad.
    const existente = await ItemLista.findOne({
      listaId: lista._id,
      productoId: producto._id,
      comprado: false,
    });

    if (existente) {
      existente.cantidad += cantidad;
      await existente.save();
      res.status(200).json(existente);
      return;
    }

    const categoria = await Categoria.findById(producto.categoria).select('nombre icono');

    const item = await ItemLista.create({
      listaId: lista._id,
      productoId: producto._id,
      categoriaId: producto.categoria,
      nombre: producto.nombre,
      precio: producto.precio,
      categoriaNombre: categoria?.nombre ?? '',
      categoriaIcono: categoria?.icono ?? '🛍️',
      cantidad,
      comprado: false,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo añadir el producto a la lista.' });
  }
};

// PATCH /api/lista/:id — cambiar la cantidad o el estado de comprado
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const lista = await obtenerListaCompra(String(req.query['listaId'] ?? '').trim());

    if (!lista) {
      res.status(404).json({ mensaje: 'Lista no encontrada.' });
      return;
    }

    const cambios: Record<string, unknown> = {};

    if (req.body?.cantidad !== undefined) {
      const cantidad = cantidadValida(req.body.cantidad);

      if (cantidad === null) {
        res.status(400).json({ mensaje: 'La cantidad debe ser un número mayor que cero.' });
        return;
      }

      cambios['cantidad'] = cantidad;
    }

    if (req.body?.comprado !== undefined) {
      cambios['comprado'] = Boolean(req.body.comprado);
    }

    if (Object.keys(cambios).length === 0) {
      res.status(400).json({ mensaje: 'No hay cambios que aplicar.' });
      return;
    }

    const item = await ItemLista.findOneAndUpdate(
      { _id: req.params['id'], listaId: lista._id },
      { $set: cambios },
      { returnDocument: 'after', runValidators: true },
    );

    if (!item) {
      res.status(404).json({ mensaje: 'Artículo no encontrado en la lista.' });
      return;
    }

    res.status(200).json(item);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo modificar el artículo.' });
  }
};

// DELETE /api/lista/comprados — quitar todos los artículos comprados
export const clearComprados = async (req: Request, res: Response): Promise<void> => {
  try {
    const lista = await obtenerListaCompra(String(req.query['listaId'] ?? '').trim());

    if (!lista) {
      res.status(404).json({ mensaje: 'Lista no encontrada.' });
      return;
    }

    const resultado = await ItemLista.deleteMany({ listaId: lista._id, comprado: true });

    res.status(200).json({
      mensaje: 'Artículos comprados eliminados.',
      eliminados: resultado.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudieron eliminar los artículos comprados.' });
  }
};

// DELETE /api/lista/:id — quitar un artículo de la lista
export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const lista = await obtenerListaCompra(String(req.query['listaId'] ?? '').trim());

    if (!lista) {
      res.status(404).json({ mensaje: 'Lista no encontrada.' });
      return;
    }

    const item = await ItemLista.findOneAndDelete({
      _id: req.params['id'],
      listaId: lista._id,
    });

    if (!item) {
      res.status(404).json({ mensaje: 'Artículo no encontrado en la lista.' });
      return;
    }

    res.status(200).json({ mensaje: 'Artículo eliminado de la lista.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo eliminar el artículo.' });
  }
};

import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { Categoria } from '../models/categoria.model.js';
import { ItemLista } from '../models/item-lista.model.js';
import { Producto } from '../models/producto.model.js';

function nombreValido(value: unknown): string | null {
  const nombre = String(value ?? '').trim();
  return nombre.length > 0 && nombre.length <= 100 ? nombre : null;
}

function precioValido(value: unknown): number | null {
  const precio = Number(value);
  return Number.isFinite(precio) && precio >= 0 ? precio : null;
}

/** Comprueba que la categoría existe. */
async function categoriaValida(
  categoriaId: unknown,
): Promise<{ _id: Types.ObjectId; nombre: string; icono: string } | null> {
  if (!categoriaId) {
    return null;
  }

  try {
    return await Categoria.findById(categoriaId).select('nombre icono');
  } catch {
    return null;
  }
}

// GET /api/productos — listar el catálogo
export const getProductos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const productos = await Producto.find().sort({ nombre: 1 });
    res.status(200).json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar los productos.' });
  }
};

// GET /api/productos/:id — obtener un producto
export const getProductoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const producto = await Producto.findById(req.params['id']);

    if (!producto) {
      res.status(404).json({ mensaje: 'Producto no encontrado.' });
      return;
    }

    res.status(200).json(producto);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'Id de producto no válido.' });
  }
};

// POST /api/productos — crear un producto
export const createProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const nombre = nombreValido(req.body?.nombre);
    const precio = precioValido(req.body?.precio);
    const categoria = await categoriaValida(req.body?.categoria);

    if (!nombre) {
      res.status(400).json({ mensaje: 'El nombre del producto es obligatorio.' });
      return;
    }

    if (precio === null) {
      res.status(400).json({ mensaje: 'El precio debe ser un número positivo.' });
      return;
    }

    if (!categoria) {
      res.status(400).json({ mensaje: 'Selecciona una categoría válida.' });
      return;
    }

    const producto = await Producto.create({
      nombre,
      precio,
      categoria: categoria._id,
    });

    res.status(201).json(producto);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo crear el producto.' });
  }
};

// PUT /api/productos/:id — modificar un producto
export const updateProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const cambios: Record<string, unknown> = {};

    if (req.body?.nombre !== undefined) {
      const nombre = nombreValido(req.body.nombre);

      if (!nombre) {
        res.status(400).json({ mensaje: 'El nombre del producto no es válido.' });
        return;
      }

      cambios['nombre'] = nombre;
    }

    if (req.body?.precio !== undefined) {
      const precio = precioValido(req.body.precio);

      if (precio === null) {
        res.status(400).json({ mensaje: 'El precio debe ser un número positivo.' });
        return;
      }

      cambios['precio'] = precio;
    }

    if (req.body?.categoria !== undefined) {
      const categoria = await categoriaValida(req.body.categoria);

      if (!categoria) {
        res.status(400).json({ mensaje: 'Selecciona una categoría válida.' });
        return;
      }

      cambios['categoria'] = categoria._id;
    }

    const producto = await Producto.findOneAndUpdate({ _id: req.params['id'] }, cambios, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!producto) {
      res.status(404).json({ mensaje: 'Producto no encontrado.' });
      return;
    }

    // Mantiene sincronizados los artículos que ya están en la lista.
    if (Object.keys(cambios).length > 0) {
      const categoria = await Categoria.findById(producto.categoria).select('nombre icono');
      const actualizacion: Record<string, unknown> = {};

      if (cambios['nombre'] !== undefined) {
        actualizacion['nombre'] = producto.nombre;
      }

      if (cambios['precio'] !== undefined) {
        actualizacion['precio'] = producto.precio;
      }

      if (categoria) {
        actualizacion['categoriaNombre'] = categoria.nombre;
        actualizacion['categoriaIcono'] = categoria.icono;
        actualizacion['categoriaId'] = producto.categoria;
      }

      if (Object.keys(actualizacion).length > 0) {
        await ItemLista.updateMany(
          { productoId: producto._id },
          { $set: actualizacion },
        );
      }
    }

    res.status(200).json(producto);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo modificar el producto.' });
  }
};

// DELETE /api/productos/:id — eliminar un producto
export const deleteProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const producto = await Producto.findOneAndDelete({ _id: req.params['id'] });

    if (!producto) {
      res.status(404).json({ mensaje: 'Producto no encontrado.' });
      return;
    }

    // Los artículos ya añadidos a la lista se conservan como copia.
    res.status(200).json({ mensaje: 'Producto eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo eliminar el producto.' });
  }
};

import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Categoria } from '../models/categoria.model.js';
import { ItemLista } from '../models/item-lista.model.js';
import { Producto } from '../models/producto.model.js';
import { Seccion } from '../models/seccion.model.js';

function nombreValido(value: unknown): string | null {
  const nombre = String(value ?? '').trim();
  return nombre.length > 0 && nombre.length <= 100 ? nombre : null;
}

function precioValido(value: unknown): number | null {
  const precio = Number(value);
  return Number.isFinite(precio) && precio >= 0 ? precio : null;
}

function rutaValida(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const ruta = Number(value);
  return Number.isInteger(ruta) && ruta >= 1 && ruta <= 19 ? ruta : undefined;
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

async function seccionValida(seccionId: unknown) {
  if (typeof seccionId !== 'string' || !Types.ObjectId.isValid(seccionId)) {
    return null;
  }

  return Seccion.findById(seccionId);
}

function subseccionValida(value: unknown, subsecciones: string[]): string | null {
  const subseccion = String(value ?? '').trim();
  return !subseccion || subsecciones.includes(subseccion) ? subseccion : null;
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
    const r = rutaValida(req.body?.r ?? null);
    const categoria = await categoriaValida(req.body?.categoria);
    const seccion = await seccionValida(req.body?.seccion);
    const subseccion = seccion
      ? subseccionValida(req.body?.subseccion, seccion.subsecciones)
      : null;

    if (!nombre) {
      res.status(400).json({ mensaje: 'El nombre del producto es obligatorio.' });
      return;
    }

    if (precio === null) {
      res.status(400).json({ mensaje: 'El precio debe ser un número positivo.' });
      return;
    }

    if (r === undefined) {
      res.status(400).json({ mensaje: 'La ruta debe ser un número entero entre 1 y 19.' });
      return;
    }

    if (!categoria) {
      res.status(400).json({ mensaje: 'Selecciona una categoría válida.' });
      return;
    }

    if (!seccion) {
      res.status(400).json({ mensaje: 'Selecciona una sección válida.' });
      return;
    }

    if (subseccion === null) {
      res.status(400).json({ mensaje: 'Selecciona una subsección válida para esa sección.' });
      return;
    }

    const producto = await Producto.create({
      nombre,
      precio,
      categoria: categoria._id,
      seccion: seccion._id,
      subseccion,
      r: r ?? null,
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

    if (req.body?.r !== undefined) {
      const r = rutaValida(req.body.r);

      if (r === undefined) {
        res.status(400).json({ mensaje: 'La ruta debe ser un número entero entre 1 y 19.' });
        return;
      }

      cambios['r'] = r;
    }

    if (req.body?.categoria !== undefined) {
      const categoria = await categoriaValida(req.body.categoria);

      if (!categoria) {
        res.status(400).json({ mensaje: 'Selecciona una categoría válida.' });
        return;
      }

      cambios['categoria'] = categoria._id;
    }

    if (req.body?.seccion !== undefined || req.body?.subseccion !== undefined) {
      const actual = await Producto.findById(req.params['id']).select('seccion subseccion');

      if (!actual) {
        res.status(404).json({ mensaje: 'Producto no encontrado.' });
        return;
      }

      const seccionCambiada = req.body?.seccion !== undefined;
      const seccion = seccionCambiada
        ? await seccionValida(req.body.seccion)
        : actual.seccion
          ? await Seccion.findById(actual.seccion)
          : null;

      if (!seccion) {
        res.status(400).json({ mensaje: 'Selecciona una sección válida.' });
        return;
      }

      const valorSubseccion =
        req.body?.subseccion !== undefined
          ? req.body.subseccion
          : seccionCambiada && String(actual.seccion) !== String(seccion._id)
            ? ''
            : actual.subseccion;
      const subseccion = subseccionValida(valorSubseccion, seccion.subsecciones);

      if (subseccion === null) {
        res.status(400).json({ mensaje: 'Selecciona una subsección válida para esa sección.' });
        return;
      }

      cambios['seccion'] = seccion._id;
      cambios['subseccion'] = subseccion;
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

      if (cambios['seccion'] !== undefined || cambios['subseccion'] !== undefined) {
        const seccion = producto.seccion
          ? await Seccion.findById(producto.seccion).select('nombre')
          : null;
        actualizacion['seccionId'] = producto.seccion ?? null;
        actualizacion['seccionNombre'] = seccion?.nombre ?? '';
        actualizacion['subseccion'] = producto.subseccion ?? '';
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

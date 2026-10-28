import { ItemLista } from '../models/item-lista.model.js';
import { Producto } from '../models/producto.model.js';
import { Seccion } from '../models/seccion.model.js';

export async function sincronizarSeccionesDeArticulosExistentes(): Promise<void> {
  const productoIds = await ItemLista.distinct('productoId', {
    productoId: { $ne: null },
    seccionId: { $exists: false },
  });

  if (!productoIds.length) {
    return;
  }

  const productos = await Producto.find({ _id: { $in: productoIds } })
    .select('seccion subseccion')
    .lean();
  const seccionIds = productos
    .map((producto) => producto.seccion)
    .filter((id) => id !== null && id !== undefined);
  const secciones = await Seccion.find({ _id: { $in: seccionIds } })
    .select('nombre')
    .lean();
  const nombresPorSeccion = new Map(
    secciones.map((seccion) => [String(seccion._id), seccion.nombre]),
  );

  if (!productos.length) {
    await ItemLista.updateMany(
      { productoId: { $in: productoIds }, seccionId: { $exists: false } },
      { $set: { seccionId: null, seccionNombre: '', subseccion: '' } },
    );
    return;
  }

  await ItemLista.bulkWrite(
    productos.map((producto) => ({
      updateMany: {
        filter: {
          productoId: producto._id,
          seccionId: { $exists: false },
        },
        update: {
          $set: {
            seccionId: producto.seccion ?? null,
            seccionNombre: producto.seccion
              ? (nombresPorSeccion.get(String(producto.seccion)) ?? '')
              : '',
            subseccion: producto.subseccion ?? '',
          },
        },
      },
    })),
  );
}

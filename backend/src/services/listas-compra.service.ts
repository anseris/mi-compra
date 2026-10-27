import { Types } from 'mongoose';
import { ItemLista } from '../models/item-lista.model.js';
import { ListaCompra } from '../models/lista-compra.model.js';

export async function obtenerListaPredeterminada() {
  const lista = await ListaCompra.findOneAndUpdate(
    { predeterminada: true },
    { $setOnInsert: { nombre: 'Lista de la compra', predeterminada: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await ItemLista.updateMany(
    { $or: [{ listaId: null }, { listaId: { $exists: false } }] },
    { $set: { listaId: lista._id } },
  );

  return lista;
}

export async function obtenerListaCompra(id?: string) {
  if (!id) {
    return obtenerListaPredeterminada();
  }

  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  return ListaCompra.findById(id);
}

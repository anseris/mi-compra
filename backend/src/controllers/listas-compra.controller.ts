import type { Request, Response } from 'express';
import { ListaCompra } from '../models/lista-compra.model.js';
import { obtenerListaPredeterminada } from '../services/listas-compra.service.js';

export const getListas = async (_req: Request, res: Response): Promise<void> => {
  try {
    await obtenerListaPredeterminada();
    const listas = await ListaCompra.find().sort({ predeterminada: -1, createdAt: 1 });
    res.status(200).json(listas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudieron consultar las listas.' });
  }
};

export const createLista = async (req: Request, res: Response): Promise<void> => {
  try {
    const nombre = String(req.body?.nombre ?? '').trim();

    if (!nombre) {
      res.status(400).json({ mensaje: 'Escribe un nombre para la lista.' });
      return;
    }

    if (nombre.length > 60) {
      res.status(400).json({ mensaje: 'El nombre no puede superar los 60 caracteres.' });
      return;
    }

    const duplicada = await ListaCompra.findOne({
      nombre: { $regex: `^${nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (duplicada) {
      res.status(409).json({ mensaje: 'Ya existe una lista con ese nombre.' });
      return;
    }

    const lista = await ListaCompra.create({ nombre });
    res.status(201).json(lista);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo crear la lista.' });
  }
};

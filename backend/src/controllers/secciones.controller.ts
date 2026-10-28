import type { Request, Response } from 'express';
import { Seccion } from '../models/seccion.model.js';

export const getSecciones = async (_req: Request, res: Response): Promise<void> => {
  try {
    const secciones = await Seccion.find().sort({ orden: 1, nombre: 1 });
    res.status(200).json(secciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudieron consultar las secciones.' });
  }
};

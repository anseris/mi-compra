import type { Request, Response } from 'express';
import { Seccion, normalizarNombreSeccion } from '../models/seccion.model.js';

export const getSecciones = async (_req: Request, res: Response): Promise<void> => {
  try {
    const secciones = await Seccion.find().sort({ orden: 1, nombre: 1 });
    res.status(200).json(secciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudieron consultar las secciones.' });
  }
};

export const createSeccion = async (req: Request, res: Response): Promise<void> => {
  try {
    const nombre = String(req.body?.nombre ?? '').trim();

    if (!nombre || nombre.length > 40) {
      res.status(400).json({ mensaje: 'El nombre de la sección es obligatorio y no puede superar los 40 caracteres.' });
      return;
    }

    const duplicada = (await Seccion.find().select('nombre')).some(
      (seccion) => normalizarNombreSeccion(seccion.nombre) === normalizarNombreSeccion(nombre),
    );

    if (duplicada) {
      res.status(409).json({ mensaje: 'Ya existe una sección con ese nombre.' });
      return;
    }

    const orden = (await Seccion.findOne().sort({ orden: -1 }).select('orden'))?.orden ?? -1;
    const seccion = await Seccion.create({ nombre, subsecciones: [], orden: orden + 1 });
    res.status(201).json(seccion);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo crear la sección.' });
  }
};

export const addSubseccion = async (req: Request, res: Response): Promise<void> => {
  try {
    const nombre = String(req.body?.nombre ?? '').trim();

    if (!nombre || nombre.length > 40) {
      res.status(400).json({ mensaje: 'El nombre de la subsección es obligatorio y no puede superar los 40 caracteres.' });
      return;
    }

    const seccion = await Seccion.findById(req.params['id']);

    if (!seccion) {
      res.status(404).json({ mensaje: 'Sección no encontrada.' });
      return;
    }

    if (
      seccion.subsecciones.some(
        (subseccion) => normalizarNombreSeccion(subseccion) === normalizarNombreSeccion(nombre),
      )
    ) {
      res.status(409).json({ mensaje: 'Ya existe esa subsección en la sección seleccionada.' });
      return;
    }

    seccion.subsecciones.push(nombre);
    await seccion.save();
    res.status(201).json(seccion);
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: 'No se pudo crear la subsección.' });
  }
};

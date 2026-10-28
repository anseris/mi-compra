import { Router } from 'express';
import {
  addSubseccion,
  createSeccion,
  getSecciones,
} from '../controllers/secciones.controller.js';

const router = Router();

router.get('/', getSecciones);
router.post('/', createSeccion);
router.post('/:id/subsecciones', addSubseccion);

export default router;

import { Router } from 'express';
import { getSecciones } from '../controllers/secciones.controller.js';

const router = Router();

router.get('/', getSecciones);

export default router;

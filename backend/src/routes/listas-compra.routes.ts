import { Router } from 'express';
import { createLista, getListas } from '../controllers/listas-compra.controller.js';

const router = Router();

router.get('/', getListas);
router.post('/', createLista);

export default router;

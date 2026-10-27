import { Router } from 'express';
import { createLista, deleteLista, getListas } from '../controllers/listas-compra.controller.js';

const router = Router();

router.get('/', getListas);
router.post('/', createLista);
router.delete('/:id', deleteLista);

export default router;

import { Router } from 'express';
import {
  addItem,
  clearComprados,
  deleteItem,
  getItems,
  updateItem,
} from '../controllers/lista-compra.controller.js';

const router = Router();

router.get('/', getItems);
router.post('/', addItem);
// Las rutas fijas deben ir antes que las que usan un id.
router.delete('/comprados', clearComprados);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;

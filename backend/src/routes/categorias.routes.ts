import { Router } from 'express';
import {
  createCategoria,
  deleteCategoria,
  getCategoriaById,
  getCategorias,
  updateCategoria,
} from '../controllers/categorias.controller.js';

const router = Router();

router.get('/', getCategorias);
router.get('/:id', getCategoriaById);
router.post('/', createCategoria);
router.put('/:id', updateCategoria);
router.delete('/:id', deleteCategoria);

export default router;

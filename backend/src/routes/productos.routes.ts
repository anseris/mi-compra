import { Router } from 'express';
import {
  createProducto,
  deleteProducto,
  getProductoById,
  getProductos,
  updateProducto,
} from '../controllers/productos.controller.js';

const router = Router();

router.get('/', getProductos);
router.get('/:id', getProductoById);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

export default router;

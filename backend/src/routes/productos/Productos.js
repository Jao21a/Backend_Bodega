// routes/productosRoutes.js
const express = require('express');
const router = express.Router();
const productosController = require('../../controllers/productosController');
const { check } = require('express-validator');

// Validaciones reusables
const validarProductoRules = [
  check('nombre').isString().trim().notEmpty().withMessage('nombre es obligatorio'),
  check('precio').isFloat({ gt: 0 }).withMessage('precio debe ser un número mayor a 0'),
  check('stock').isInt({ min: 0 }).withMessage('stock debe ser entero >= 0'),
  check('categoria').isString().trim().notEmpty().withMessage('categoria es obligatoria'),
  check('proveedor').optional().isString().trim()
];

// === Rutas para productos ===
router.get('/lista_productos', productosController.obtenerProductos);
router.get('/:id', productosController.obtenerProductoPorId);
router.post('/crear_producto', validarProductoRules, productosController.crearProducto);
router.put('/:id', validarProductoRules, productosController.actualizarProducto);
router.patch('/:id/desactivar', productosController.desactivarProducto);
router.patch('/:id/activar', productosController.activarProducto);

module.exports = router;


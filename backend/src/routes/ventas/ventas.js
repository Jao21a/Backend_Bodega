<<<<<<< HEAD
const router = require('express').Router();
const ctrl = require('../controllers/ventas.controller');

router.get('/', ctrl.listarVentas);
router.get('/:id', ctrl.obtenerVenta);
router.post('/', ctrl.crearVenta);
router.post('/:id/anular', ctrl.anularVenta);
router.get('/:id/boleta.pdf', ctrl.boletaPDF);

module.exports = router;
=======
// routes/ventas/ventas.js
const express = require('express');
const router = express.Router();
const ventasProductosController = require('../../controllers/ventasProductosController');

// === Rutas para productos de las ventas ===

router.get('/lista', ventasProductosController.obtenerVentasProductos);
router.get('/producto/:id', ventasProductosController.obtenerVentaProductoPorId);
router.post('/crear_venta', ventasProductosController.crearVenta);
router.put('/actualizar_producto/:id', ventasProductosController.actualizarProductoEnVenta);
router.patch('/productos/:id', ventasProductosController.desactivarVenta);


module.exports = router;
>>>>>>> abcc482032fe30c76bd14bb9887e5100eda537b3

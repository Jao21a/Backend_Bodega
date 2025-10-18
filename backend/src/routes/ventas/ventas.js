const router = require('express').Router();
const ctrl = require('../controllers/ventas.controller');

router.get('/', ctrl.listarVentas);
router.get('/:id', ctrl.obtenerVenta);
router.post('/', ctrl.crearVenta);
router.post('/:id/anular', ctrl.anularVenta);
router.get('/:id/boleta.pdf', ctrl.boletaPDF);

module.exports = router;
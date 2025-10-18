const express = require('express');
const router = express.Router();

// Importar subrutas
const productosRouter = require('./productos/Productos');
const ventasRouter = require('./ventas/Ventas');
//const proveedoresRouter = require('./proveedores/proveedores');
//const comprasRouter = require('./compras/compras');

// Usar rutas
router.use('/productos', productosRouter);
router.use('/ventas', ventasRouter);
//router.use('/proveedores', proveedoresRouter);
//router.use('/compras', comprasRouter);

// Ruta raíz de la API
router.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de la bodega 🍷' });
});

module.exports = router;



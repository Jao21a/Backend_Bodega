// =======================
// Dependencias principales
// =======================
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database/database.js'); // Conexión MongoDB

// =======================
// Conectar a la base de datos
// =======================
connectDB();





// =======================
// Inicializar aplicación
// =======================
const app = express();

//PUERTO
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTTP escuchando en :${PORT}`));

// Varialbes Para RUtas
const productosRoutes = require('./routes/productos/Productos.js');      // <-- nombre del archivo real
const ventasRoutes    = require('./routes/ventas/ventas.js');         // <-- nombre del archivo real


// =======================
// Middlewares globales
// =======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, '../public'))); // opcional

// =======================
// Importar rutas principales
// =======================
const indexRouter = require('./routes/index');

// =======================
// Usar rutas agrupadas
// =======================
// 🔗 Todas tus rutas pasarán por /api
// Ejemplo: /api/productos, /api/ventas, /api/proveedores...
app.use('/api', indexRouter);
app.use('/api/productos', productosRoutes);  // <-- este prefijo DEBE coincidir con Insomnia
app.use('/api/ventas', ventasRoutes);

// =======================
// Manejo de errores 404
// =======================
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
  app.use('/api/ventas', require('./routes/ventas'));
});

// =======================
// Manejo de errores globales
// =======================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno', detail: err.message });
});

// =======================
// Exportar aplicación
// =======================
module.exports = app;

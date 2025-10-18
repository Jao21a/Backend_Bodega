// =======================
// Dependencias principales
// =======================
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./config/database/database.js');

// =======================
// Conexión a la base de datos
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
// Seguridad y rendimiento
// =======================
app.use(helmet()); // cabeceras seguras
app.use(mongoSanitize()); // evita NoSQL injection
app.use(xss()); // limpia entradas de XSS
app.use(hpp()); // evita parameter pollution
app.use(compression()); // GZIP

// =======================
// CORS (ajustar según entorno)
// =======================
//app.use(cors({
//  origin: ['https://tu-front.com', 'http://localhost:5173'], // ajusta tu frontend
//  credentials: true
//}));

// =======================
// Middlewares globales
// =======================
app.use(cors());


// =======================
// Rate Limiting
// =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por IP
  message: 'Demasiadas solicitudes desde esta IP, inténtalo más tarde.'
});

app.use('/api', limiter);

// =======================
// Logger y parseadores
// =======================
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());


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

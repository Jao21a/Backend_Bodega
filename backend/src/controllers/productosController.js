// controllers/productosController.js

const productosRepository = require('../repositories/productosRepository');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const _ = require('lodash'); // para pick

// Campos permitidos para crear/actualizar (whitelist)
const CAMPOS_PERMITIDOS = ['nombre', 'precio', 'stock', 'categoria', 'proveedor'];

// Función para validar resultados de express-validator
const validarResultado = (req) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const mensaje = errores.array().map(e => `${e.param}: ${e.msg}`).join('; ');
    const err = new Error(mensaje);
    err.status = 400;
    throw err;
  }
};

// Controladores
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await productosRepository.obtenerTodos();
    res.json(productos);
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

exports.obtenerProductoPorId = async (req, res) => {
  try {
    // Validar ObjectId
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const producto = await productosRepository.obtenerPorId(id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json(producto);
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error al obtener el producto', error: error.message });
  }
};

exports.crearProducto = async (req, res) => {
  try {
    validarResultado(req);

    // Sólo tomar campos permitidos (previene parámetros inesperados / NoSQL injection)
    const datos = _.pick(req.body, CAMPOS_PERMITIDOS);

    const producto = await productosRepository.crear(datos);
    res.status(201).json(producto);
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error al crear producto', error: error.message });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    validarResultado(req);

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const datos = _.pick(req.body, CAMPOS_PERMITIDOS);

    const productoActualizado = await productosRepository.actualizar(id, datos);
    if (!productoActualizado) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json(productoActualizado);
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Error al actualizar producto', error: error.message });
  }
};

exports.desactivarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { modo } = req.query; // puede ser 'manual' o 'auto'

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Buscar producto
    const producto = await productosRepository.obtenerPorId(id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // MODO AUTOMÁTICO
    if (modo === 'auto') {
      if (producto.stock <= 0) {
        const productoDesactivado = await productosRepository.desactivar(id);
        return res.json({
          message: 'Producto desactivado automáticamente (sin stock)',
          producto: productoDesactivado,
        });
      } else {
        return res.status(400).json({
          message: 'El producto aún tiene stock, no se puede desactivar automáticamente',
        });
      }
    }

    // MODO MANUAL (por defecto)
    const productoDesactivado = await productosRepository.desactivar(id);
    res.json({
      message: 'Producto desactivado manualmente',
      producto: productoDesactivado,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: 'Error al desactivar producto',
      error: error.message,
    });
  }
};

exports.activarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { modo } = req.query; // 'manual' o 'auto'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const producto = await productosRepository.obtenerPorId(id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (modo === 'auto') {
      if (producto.stock > 0) {
        const productoActivado = await productosRepository.activar(id);
        return res.json({
          message: 'Producto activado automáticamente (stock disponible)',
          producto: productoActivado,
        });
      } else {
        return res.status(400).json({ message: 'El producto aún no tiene stock, no se puede activar automáticamente' });
      }
    }

    const productoActivado = await productosRepository.activar(id);
    res.json({ message: 'Producto activado manualmente', producto: productoActivado });

  } catch (error) {
    res.status(500).json({ message: 'Error al activar producto', error: error.message });
  }
};
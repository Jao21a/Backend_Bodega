// controllers/ventasProductosController.js
const ventaProductoRepository = require('../repositories/ventasProductosRepository');

// Obtener todos los registros de productos vendidos
exports.obtenerVentasProductos = async (req, res) => {
  try {
    const ventasProductos = await ventaProductoRepository.obtenerTodos();
    res.status(200).json(ventasProductos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un producto de venta por ID
exports.obtenerVentaProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const ventaProducto = await ventaProductoRepository.obtenerPorId(id);
    res.status(200).json(ventaProducto);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Crear una nueva venta
exports.crearVenta = async (req, res) => {
  try {
    const nuevaVenta = await ventaProductoRepository.crearVenta(req.body);
    res.status(201).json({
      message: 'Venta creada correctamente',
      venta: nuevaVenta
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Actualizar un producto dentro de una venta
exports.actualizarProductoEnVenta = async (req, res) => {
  try {
    const { id } = req.params; // ID de la venta
    const { productoId, cantidad } = req.body;

    // Enviar un array de productos a la función actualizar
    const ventaActualizada = await ventaProductoRepository.actualizar(id, [
      { productoId, cantidad }
    ]);

    res.status(200).json({
      message: "Producto actualizado correctamente en la venta",
      venta: ventaActualizada
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Desactivar una venta
exports.desactivarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await ventaProductoRepository.desactivar(id);

    res.status(200).json({
      message: resultado.message
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
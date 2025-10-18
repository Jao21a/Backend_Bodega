// repositories/ventaProductoRepository.js
const mongoose = require('mongoose');
const Venta = require('../models/Venta');
const VentaProducto = require('../models/VentaProducto');
const Producto = require('../models/Producto');

// 🔹 Función auxiliar: recalcula el total de una venta
const recalcularTotalVenta = async (ventaId) => {
  const productos = await VentaProducto.find({ venta: ventaId });
  const nuevoTotal = productos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  await Venta.findByIdAndUpdate(ventaId, { total: nuevoTotal });
};

// Obtener todos los registros de productos vendidos (solo de ventas activas)
const obtenerTodos = async () => {
  try {
    const ventasProductos = await VentaProducto.find()
      .populate({
        path: 'venta',
        select: 'fecha total estado',
        match: { estado: true }
      })
      .populate('producto', 'nombre precio');

    return ventasProductos.filter(vp => vp.venta !== null);
  } catch (error) {
    throw new Error('Error al obtener los productos de ventas: ' + error.message);
  }
};

// Obtener un producto de venta por su ID
const obtenerPorId = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('ID inválido');
    }

    const ventaProducto = await VentaProducto.findById(id)
      .populate('venta', 'fecha total estado')
      .populate('producto', 'nombre precio');

    if (!ventaProducto) {
      throw new Error('Producto de venta no encontrado');
    }

    if (!ventaProducto.venta?.estado) {
      throw new Error('La venta asociada está desactivada');
    }

    return ventaProducto;
  } catch (error) {
    throw new Error('Error al obtener el producto de venta: ' + error.message);
  }
};

const crearVenta = async (datos) => {
  try {
    const { clienteId, clienteNombre, clienteDNI, personaGeneral = true, productos } = datos;

    if (!Array.isArray(productos) || productos.length === 0) {
      throw new Error('La venta debe contener al menos un producto');
    }

    const nuevaVenta = new Venta({
      clienteId: clienteId || null,
      clienteNombre: clienteNombre || (personaGeneral ? 'Persona General' : undefined),
      clienteDNI: clienteDNI || (personaGeneral ? null : undefined),
      personaGeneral: !!personaGeneral,
      productos: [],
      total: 0
    });

    await nuevaVenta.save();

    let total = 0;

    for (const item of productos) {
      const { productoId, cantidad } = item;

      if (!mongoose.Types.ObjectId.isValid(productoId)) {
        throw new Error(`productoId inválido: ${productoId}`);
      }

      if (typeof cantidad !== 'number' || cantidad <= 0) {
        throw new Error(`Cantidad inválida para producto ${productoId}`);
      }

      const producto = await Producto.findById(productoId);
      if (!producto) {
        throw new Error(`Producto no encontrado: ${productoId}`);
      }

      const precioUnitario = producto.precio;
      const subtotal = cantidad * precioUnitario;

      const nuevoVP = new VentaProducto({
        venta: nuevaVenta._id,
        producto: producto._id,
        cantidad,
        precioUnitario,
        subtotal
      });

      await nuevoVP.save();

      nuevaVenta.productos.push(nuevoVP._id);
      total += subtotal;

      if (typeof producto.stock === 'number') {
        if (producto.stock < cantidad) {
          throw new Error(`Stock insuficiente para el producto ${producto.nombre}`);
        }
        producto.stock -= cantidad;
        await producto.save();
      }
    }

    nuevaVenta.total = total;
    await nuevaVenta.save();

    return await Venta.findById(nuevaVenta._id)
      .populate({
        path: 'productos',
        populate: { path: 'producto', select: 'nombre precio' }
      });
  } catch (error) {
    throw new Error('Error al crear la venta: ' + error.message);
  }
};



// Actualizar un producto dentro de una venta
const actualizar = async (ventaId, productosActualizados) => {
  try {
    const venta = await Venta.findById(ventaId).populate({
      path: 'productos',
      populate: { path: 'producto', select: 'nombre precio stock estado' }
    });
    if (!venta) throw new Error('Venta no encontrada');

    let total = 0;

    for (const item of productosActualizados) {
      const { productoId, cantidad } = item;

      if (!mongoose.Types.ObjectId.isValid(productoId)) {
        throw new Error(`productoId inválido: ${productoId}`);
      }
      if (typeof cantidad !== 'number' || cantidad <= 0) {
        throw new Error(`Cantidad inválida para producto ${productoId}`);
      }

      let vp = await VentaProducto.findOne({ venta: ventaId, producto: productoId }).populate('producto');
      const producto = await Producto.findById(productoId);
      if (!producto) throw new Error(`Producto no encontrado: ${productoId}`);

      if (vp) {
        // Ajustar stock según diferencia
        const diferencia = cantidad - vp.cantidad;

        if (diferencia > 0 && producto.stock < diferencia) {
          throw new Error(`Stock insuficiente para el producto ${producto.nombre}`);
        }

        producto.stock -= diferencia;

        // 🔹 Activar/desactivar automáticamente según stock
        producto.estado = producto.stock > 0;

        await producto.save();

        vp.cantidad = cantidad;
        vp.subtotal = cantidad * vp.precioUnitario;
        await vp.save();

      } else {
        // Nuevo producto agregado
        if (producto.stock < cantidad) {
          throw new Error(`Stock insuficiente para el producto ${producto.nombre}`);
        }

        const nuevoVP = new VentaProducto({
          venta: venta._id,
          producto: producto._id,
          cantidad,
          precioUnitario: producto.precio,
          subtotal: cantidad * producto.precio
        });

        await nuevoVP.save();
        venta.productos.push(nuevoVP._id);

        producto.stock -= cantidad;

        // 🔹 Activar/desactivar automáticamente según stock
        producto.estado = producto.stock > 0;

        await producto.save();
      }
    }

    // Recalcular total
    const productosEnVenta = await VentaProducto.find({ venta: ventaId });
    total = productosEnVenta.reduce((sum, p) => sum + (p.subtotal || 0), 0);

    venta.total = total;
    await venta.save();

    return await Venta.findById(ventaId).populate({
      path: 'productos',
      populate: { path: 'producto', select: 'nombre precio stock estado' }
    });

  } catch (error) {
    throw new Error('Error al actualizar la venta: ' + error.message);
  }
};




// Desactivar una venta (lógica)
const desactivar = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('ID inválido');
    }

    const ventaProducto = await VentaProducto.findById(id);
    if (!ventaProducto) {
      throw new Error('Producto de venta no encontrado');
    }

    const ventaAsociada = await Venta.findById(ventaProducto.venta);
    if (ventaAsociada) {
      ventaAsociada.estado = false;
      await ventaAsociada.save();

      // 🔹 Recalcular total (por si quedan otros productos activos)
      await recalcularTotalVenta(ventaProducto.venta);
    }

    return { message: 'Venta desactivada correctamente (no eliminada físicamente)' };
  } catch (error) {
    throw new Error('Error al desactivar la venta: ' + error.message);
  }
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crearVenta,
  actualizar,
  desactivar
};


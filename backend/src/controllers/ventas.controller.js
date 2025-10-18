const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Consecutivo = require('../models/Consecutivo');
const boletaPDF = require('../utils/boletaPdf');

const IGV = 0.18;
const money = n => Math.round((n + Number.EPSILON) * 100) / 100;

exports.crearVenta = async (req, res, next) => {
  try {
    const { items, cliente, pago, serie = 'B001' } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'Items requeridos' });

    // 1) Cargar productos y validar stock
    const ids = items.map(i => i.productoId);
    const prods = await Producto.find({ _id: { $in: ids } });
    const map = new Map(prods.map(p => [String(p._id), p]));

    for (const it of items) {
      const p = map.get(String(it.productoId));
      if (!p) return res.status(400).json({ message: `Producto no existe (${it.productoId})` });
      if (p.stock < it.cantidad) {
        return res.status(409).json({ message: `Stock insuficiente: ${p.nombre}` });
      }
    }

    // 2) Calcular totales con base a tu modelo (precio = con IGV por defecto)
    const itemsVenta = items.map(it => {
      const p = map.get(String(it.productoId));
      const precioBase = p.igvIncluido ? (p.precio / (1 + IGV)) : p.precio;
      const totalLinea = precioBase * it.cantidad;

      return {
        producto: p._id,
        nombre: p.nombre,
        cantidad: it.cantidad,
        precioUnitarioSinIGV: money(precioBase),
        totalSinIGV: money(totalLinea)
      };
    });

    const opGravada = money(itemsVenta.reduce((a, b) => a + b.totalSinIGV, 0));
    const igv = money(opGravada * IGV);
    const total = money(opGravada + igv);

    // 3) Numeración
    const sec = await Consecutivo.siguiente(`BOLETA_${serie}`);
    const numero = String(sec).padStart(8, '0');

    // 4) Crear venta
    const venta = await Venta.create({
      tipoDoc: 'BOLETA',
      serie,
      numero,
      cliente: { nombre: cliente?.nombre || 'CLIENTE VARIOS', doc: cliente?.doc || '' },
      items: itemsVenta,
      opGravada,
      igv,
      total,
      pago: {
        medio: pago?.medio || 'EFECTIVO',
        recibido: pago?.recibido || 0,
        vuelto: money((pago?.recibido || 0) - total)
      }
    });

    // 5) Descontar stock
    await Promise.all(itemsVenta.map(it => {
      return Producto.updateOne({ _id: it.producto }, { $inc: { stock: -it.cantidad } });
    }));

    res.status(201).json(venta);
  } catch (err) { next(err); }
};

exports.obtenerVenta = async (req, res, next) => {
  try {
    const venta = await Venta.findById(req.params.id).populate('items.producto', 'nombre');
    if (!venta) return res.status(404).json({ message: 'No existe' });
    res.json(venta);
  } catch (e) { next(e); }
};

exports.listarVentas = async (req, res, next) => {
  try {
    const { desde, hasta, q, page = 1, limit = 20 } = req.query;
    const filtro = {};
    if (desde || hasta) {
      filtro.createdAt = {
        ...(desde ? { $gte: new Date(desde) } : {}),
        ...(hasta ? { $lte: new Date(hasta) } : {})
      };
    }
    if (q) {
      filtro.$or = [
        { 'cliente.nombre': new RegExp(q, 'i') },
        { serie: new RegExp(q, 'i') },
        { numero: new RegExp(q, 'i') }
      ];
    }
    const data = await Venta.find(filtro)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    const total = await Venta.countDocuments(filtro);
    res.json({ data, total, page: +page, limit: +limit });
  } catch (e) { next(e); }
};

exports.anularVenta = async (req, res, next) => {
  try {
    const venta = await Venta.findById(req.params.id);
    if (!venta) return res.status(404).json({ message: 'No existe' });
    if (venta.estado === 'ANULADO') return res.status(409).json({ message: 'Ya anulado' });

    // reponer stock
    await Promise.all(venta.items.map(it => {
      return Producto.updateOne({ _id: it.producto }, { $inc: { stock: it.cantidad } });
    }));
    venta.estado = 'ANULADO';
    await venta.save();
    res.json(venta);
  } catch (e) { next(e); }
};

exports.boletaPDF = async (req, res, next) => {
  try {
    const venta = await Venta.findById(req.params.id);
    if (!venta) return res.status(404).json({ message: 'No existe' });
    return boletaPDF(res, venta);
  } catch (e) { next(e); }
};

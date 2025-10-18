<<<<<<< HEAD
const { Schema, model, Types } = require('mongoose');

const ItemVentaSchema = new Schema({
  producto: { type: Types.ObjectId, ref: 'Producto', required: true },
  nombre: String,                      // snapshot del nombre
  cantidad: { type: Number, required: true, min: 1 },
  precioUnitarioSinIGV: { type: Number, required: true },
  totalSinIGV: { type: Number, required: true }
}, { _id: false });

const VentaSchema = new Schema({
  tipoDoc: { type: String, enum: ['BOLETA'], default: 'BOLETA' },
  serie: { type: String, default: 'B001' },
  numero: { type: String }, // 8 dígitos
  cliente: {
    nombre: { type: String, default: 'CLIENTE VARIOS' },
    doc: String // DNI opcional
  },
  items: [ItemVentaSchema],
  opGravada: { type: Number, required: true },
  igv: { type: Number, required: true },
  total: { type: Number, required: true },
  pago: {
    medio: { type: String, enum: ['EFECTIVO','YAPE','PLIN','TARJETA'], default: 'EFECTIVO' },
    recibido: { type: Number, default: 0 },
    vuelto: { type: Number, default: 0 }
  },
  estado: { type: String, enum: ['EMITIDO','ANULADO'], default: 'EMITIDO' }
}, { timestamps: true });

module.exports = model('Venta', VentaSchema);
=======
const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: false
  },
  clienteNombre: {
    type: String,
    trim: true,
    default: 'Persona General'
  },
  clienteDNI: {
    type: String,
    trim: true,
    default: null
  },
  personaGeneral: {
    type: Boolean,
    default: true
  },
  productos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VentaProducto',
      required: false
    }
  ],
  fecha: {
    type: Date,
    default: Date.now
  },
  total: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'El total no puede ser negativo']
  },
  estado: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Venta', ventaSchema);
>>>>>>> abcc482032fe30c76bd14bb9887e5100eda537b3

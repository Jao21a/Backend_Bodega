const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  stock: { type: Number, required: true },
  estado: { type: Boolean, default: true }, // <-- importante
  categoria: { type: String, required: true },
  proveedor: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);

const { Schema, model } = require('mongoose');

const consecutivoSchema = new Schema({
  clave: { type: String, unique: true }, // p.ej. 'BOLETA_B001'
  secuencia: { type: Number, default: 0 }
}, { timestamps: true });

consecutivoSchema.statics.siguiente = async function (clave) {
  const doc = await this.findOneAndUpdate(
    { clave },
    { $inc: { secuencia: 1 } },
    { upsert: true, new: true }
  );
  return doc.secuencia;
};

module.exports = model('Consecutivo', consecutivoSchema);
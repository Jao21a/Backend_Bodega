const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.DB_URI; // <-- acepta ambos
    if (!uri) {
      throw new Error('No se encontró MONGO_URI ni DB_URI en el .env');
    }

    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB correctamente');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapduty';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Static files (serves prototype and assets)
app.use(express.static(__dirname));

// Route entry point to SnapDuty HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'prueba prototipo.html'));
});

// Database connection & Server initialization
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('----------------------------------------------------');
    console.log('✅ Conexión exitosa a MongoDB');
    console.log(`📦 Base de datos: ${mongoose.connection.name}`);
    console.log('----------------------------------------------------');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor SnapDuty corriendo en http://localhost:${PORT}`);
      console.log(`📄 Aplicación disponible en http://localhost:${PORT}/`);
      console.log(`🔌 API REST disponible en http://localhost:${PORT}/api/status`);
      console.log('----------------------------------------------------');
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

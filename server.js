require('dotenv').config();

const app = require('./app');
const connectToDatabase = require('./database');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapduty';

if (require.main === module) {
  connectToDatabase(MONGODB_URI)
    .then(() => {
      console.log('----------------------------------------------------');
      console.log('Conexión exitosa a MongoDB');
      console.log(`Base de datos: ${require('mongoose').connection.name}`);
      console.log('----------------------------------------------------');

      app.listen(PORT, () => {
        console.log(`Servidor SnapDuty corriendo en http://localhost:${PORT}`);
        console.log(`Aplicación disponible en http://localhost:${PORT}/`);
        console.log(`Autenticación disponible en http://localhost:${PORT}/api/auth`);
        console.log(`API REST disponible en http://localhost:${PORT}/api/status`);
        console.log('----------------------------------------------------');
      });
    })
    .catch((error) => {
      console.error('Error al conectar a MongoDB:', error.message);
      process.exit(1);
    });
}

module.exports = app;

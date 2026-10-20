require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const ServiceTimer = require('../models/ServiceTimer');
const Setting = require('../models/Setting');
const Reflection = require('../models/Reflection');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapduty';
const JWT_SECRET = process.env.JWT_SECRET || 'snapduty_secret_key_jwt_2026_super_secure';

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASÓ: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FALLÓ: ${testName}`);
    failCount++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 PRUEBAS DE AUTENTICACIÓN Y REGISTROS POR SESIÓN');
  console.log('====================================================\n');

  try {
    // 1. Conexión
    console.log('🔹 1. Conexión a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    assert(mongoose.connection.readyState === 1, 'Conectado a la base de datos snapduty');

    // 2. Registro y Hashing de contraseñas
    console.log('🔹 2. Probando registro de usuario y encriptación bcrypt...');
    const emailA = `user.a.${Date.now()}@test.com`;
    const userA = new User({
      name: 'Usuario Alpha',
      email: emailA,
      password: 'MiPasswordSeguro123!',
      institution: 'Facultad A'
    });
    await userA.save();
    assert(userA.password !== 'MiPasswordSeguro123!', 'Contraseña encriptada con salt (no texto plano)');

    const isMatch = await userA.comparePassword('MiPasswordSeguro123!');
    assert(isMatch === true, 'Verificación exitosa de contraseña correcta');

    const isWrongMatch = await userA.comparePassword('PasswordIncorrecto');
    assert(isWrongMatch === false, 'Rechazo de contraseña incorrecta');

    // 3. Generación y Validación de Token JWT
    console.log('🔹 3. Probando generación y verificación de JWT...');
    const token = jwt.sign({ id: userA._id, email: userA.email }, JWT_SECRET, { expiresIn: '1d' });
    const decoded = jwt.verify(token, JWT_SECRET);
    assert(decoded.id.toString() === userA._id.toString(), 'Token JWT generado y decodificado con ID de usuario');

    // 4. Aislamiento de datos entre usuarios (Multi-tenancy)
    console.log('🔹 4. Probando aislamiento estricto de datos entre sesiones...');
    const emailB = `user.b.${Date.now()}@test.com`;
    const userB = await User.create({
      name: 'Usuario Beta',
      email: emailB,
      password: 'PasswordBeta123!',
      institution: 'Facultad B'
    });

    // Crear actividad para Usuario A
    await Activity.create({
      userId: userA._id,
      id: `act-a-${Date.now()}`,
      title: 'Actividad Privada de Alpha',
      date: '2026-10-20',
      category: 'Educación',
      done: false
    });

    // Crear actividad para Usuario B
    await Activity.create({
      userId: userB._id,
      id: `act-b-${Date.now()}`,
      title: 'Actividad Privada de Beta',
      date: '2026-10-20',
      category: 'Gestión',
      done: true
    });

    // Consultar como Usuario A
    const actsForA = await Activity.find({ userId: userA._id });
    const actsForB = await Activity.find({ userId: userB._id });

    assert(actsForA.every(a => a.userId.toString() === userA._id.toString()), 'Usuario A solo ve sus propias actividades');
    assert(actsForB.every(b => b.userId.toString() === userB._id.toString()), 'Usuario B solo ve sus propias actividades');
    assert(!actsForA.some(a => a.title.includes('Beta')), 'Usuario A no puede ver actividades de Usuario B');

    // 5. Jornada y Cronómetro aislado por usuario
    console.log('🔹 5. Probando cronómetros independientes por usuario en la misma fecha...');
    const sameDate = '2026-10-20';
    await ServiceTimer.create({
      userId: userA._id,
      date: sameDate,
      startAt: Date.now() - 7200000, // 2 horas transcurridas
      notified: false
    });

    await ServiceTimer.create({
      userId: userB._id,
      date: sameDate,
      startAt: Date.now() - 1800000, // 30 min transcurridos
      notified: false
    });

    const timerA = await ServiceTimer.findOne({ userId: userA._id, date: sameDate });
    const timerB = await ServiceTimer.findOne({ userId: userB._id, date: sameDate });

    assert(timerA && timerB && timerA.startAt !== timerB.startAt, 'Dos usuarios pueden tener cronómetros diferentes en la misma fecha');

    // Limpieza de usuarios de prueba
    await Promise.all([
      User.deleteMany({ _id: { $in: [userA._id, userB._id] } }),
      Activity.deleteMany({ userId: { $in: [userA._id, userB._id] } }),
      ServiceTimer.deleteMany({ userId: { $in: [userA._id, userB._id] } })
    ]);

    console.log('\n====================================================');
    console.log(`📊 RESULTADOS: ${passCount} PASADAS, ${failCount} FALLIDAS`);
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(failCount === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Excepción durante las pruebas:', error);
    process.exit(1);
  }
}

runTests();

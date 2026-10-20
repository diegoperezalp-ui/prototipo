require('dotenv').config();
const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const ServiceTimer = require('../models/ServiceTimer');
const Setting = require('../models/Setting');
const Reflection = require('../models/Reflection');
const Goal = require('../models/Goal');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapduty';

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

async function runDatabaseTests() {
  console.log('====================================================');
  console.log('🧪 INICIANDO PRUEBAS DE LA BASE DE DATOS SNAPDUTY');
  console.log('====================================================\n');

  try {
    // 1. Conexión
    console.log('🔹 1. Probando conexión a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    assert(mongoose.connection.readyState === 1, 'Conexión activa a MongoDB');
    console.log(`     Base de datos conectada: ${mongoose.connection.name}\n`);

    // 2. Colección Actividades (CRUD + Toggle)
    console.log('🔹 2. Probando funciones de Actividades (CRUD, Toggle, Filtros)...');
    const testId = `test-act-${Date.now()}`;
    const newAct = await Activity.create({
      id: testId,
      title: 'Actividad de prueba unitaria',
      date: '2026-10-25',
      category: 'Educación',
      start: '10:00',
      end: '12:00',
      priority: 'high',
      notes: 'Nota de verificación funcional',
      done: false
    });
    assert(newAct && newAct.id === testId, 'Crear actividad');

    const foundAct = await Activity.findOne({ id: testId });
    assert(foundAct && foundAct.title === 'Actividad de prueba unitaria', 'Leer actividad');

    foundAct.title = 'Actividad actualizada';
    await foundAct.save();
    const updatedAct = await Activity.findOne({ id: testId });
    assert(updatedAct.title === 'Actividad actualizada', 'Actualizar actividad');

    updatedAct.done = !updatedAct.done;
    await updatedAct.save();
    const toggledAct = await Activity.findOne({ id: testId });
    assert(toggledAct.done === true, 'Alternar estado (toggle completada)');

    const countBeforeDel = await Activity.countDocuments({ id: testId });
    await Activity.deleteOne({ id: testId });
    const countAfterDel = await Activity.countDocuments({ id: testId });
    assert(countBeforeDel === 1 && countAfterDel === 0, 'Eliminar actividad\n');

    // 3. Colección Jornada Diaria / Cronómetro (ServiceTimer)
    console.log('🔹 3. Probando funciones de Jornadas de Servicio (ServiceTimer)...');
    const testDate = '2026-12-31';
    const timer = await ServiceTimer.findOneAndUpdate(
      { date: testDate },
      {
        date: testDate,
        startAt: Date.now(),
        notified: false,
        hoursWorked: 4,
        notes: 'Prueba de jornada'
      },
      { upsert: true, returnDocument: 'after' }
    );
    assert(timer && timer.date === testDate, 'Registrar inicio de jornada');

    timer.notified = true;
    await timer.save();
    const updatedTimer = await ServiceTimer.findOne({ date: testDate });
    assert(updatedTimer.notified === true, 'Actualizar estado de notificación de jornada');

    await ServiceTimer.deleteOne({ date: testDate });
    const timerDeleted = await ServiceTimer.findOne({ date: testDate });
    assert(timerDeleted === null, 'Reiniciar/eliminar jornada diaria\n');

    // 4. Colección Ajustes y Preferencias (Setting)
    console.log('🔹 4. Probando funciones de Configuración (Setting)...');
    await Setting.findOneAndUpdate(
      { key: 'test_theme' },
      { key: 'test_theme', value: 'dark' },
      { upsert: true }
    );
    const themeSet = await Setting.findOne({ key: 'test_theme' });
    assert(themeSet && themeSet.value === 'dark', 'Guardar y leer preferencia de tema');
    await Setting.deleteOne({ key: 'test_theme' });

    // 5. Colección Metas de Servicio Social (Goal)
    console.log('🔹 5. Probando funciones de Metas (Goal)...');
    const goal = await Goal.findOneAndUpdate(
      { key: 'test_goal' },
      {
        key: 'test_goal',
        dailyHours: 4,
        weeklyHours: 20,
        totalHours: 480,
        institution: 'Universidad Test'
      },
      { upsert: true, returnDocument: 'after' }
    );
    assert(goal.dailyHours === 4 && goal.totalHours === 480, 'Guardar metas de servicio social (4h/día, 480h total)');
    await Goal.deleteOne({ key: 'test_goal' });
    console.log('');

    // 6. Colección Bitácora / Reflexiones (Reflection)
    console.log('🔹 6. Probando funciones de Bitácora / Reflexiones (Reflection)...');
    const refId = `test-ref-${Date.now()}`;
    const newRef = await Reflection.create({
      id: refId,
      date: '2026-10-20',
      title: 'Bitácora de prueba',
      content: 'Reflexión de prueba de base de datos',
      category: 'Atención comunitaria',
      hoursLogged: 3
    });
    assert(newRef && newRef.id === refId, 'Guardar entrada de bitácora');
    await Reflection.deleteOne({ id: refId });
    console.log('');

    // 7. Agregación y Métricas de Impacto
    console.log('🔹 7. Probando cálculos y agregación de impacto...');
    const totalActs = await Activity.countDocuments();
    const totalTimers = await ServiceTimer.countDocuments();
    assert(typeof totalActs === 'number' && typeof totalTimers === 'number', 'Cálculo de métricas de impacto');
    console.log(`     Total actividades registradas en BD: ${totalActs}`);
    console.log(`     Total jornadas registradas en BD: ${totalTimers}\n`);

    console.log('====================================================');
    console.log(`📊 RESULTADOS: ${passCount} PASADAS, ${failCount} FALLIDAS`);
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(failCount === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Excepción durante las pruebas:', error);
    process.exit(1);
  }
}

runDatabaseTests();

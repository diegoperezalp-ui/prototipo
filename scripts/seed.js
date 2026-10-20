require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const ServiceTimer = require('../models/ServiceTimer');
const Setting = require('../models/Setting');
const Reflection = require('../models/Reflection');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapduty';

async function seedDatabase() {
  try {
    console.log('🌱 Conectando a MongoDB para poblar usuarios y registros independientes...');
    await mongoose.connect(MONGODB_URI);
    console.log(`📦 Conectado a: ${mongoose.connection.name}`);

    // Dropear base de datos para limpiar colecciones e índices antiguos
    await mongoose.connection.db.dropDatabase();
    console.log('🧹 Base de datos e índices anteriores limpiados exitosamente.');

    // 1. Crear Usuario Principal: Estudiante Demo
    const user1 = new User({
      name: 'Carlos Mendoza',
      email: 'carlos.demo@snapduty.com',
      password: 'Password123!',
      institution: 'Universidad Nacional Autónoma',
      programName: 'Brigada de Asistencia Comunitaria y Educación',
      dailyHours: 4,
      weeklyHours: 20,
      totalHours: 480
    });
    await user1.save();

    // 2. Crear Segundo Usuario: Sofía García (para demostrar aislamiento por sesión)
    const user2 = new User({
      name: 'Sofía García',
      email: 'sofia.garcia@snapduty.com',
      password: 'Password123!',
      institution: 'Instituto Politécnico Regional',
      programName: 'Programa de Alfabetización Digital y Biblioteca',
      dailyHours: 4,
      weeklyHours: 20,
      totalHours: 480
    });
    await user2.save();

    console.log('👤 Usuarios creados con contraseñas encriptadas con bcrypt:');
    console.log(`   1. ${user1.name} (${user1.email}) - Pass: Password123!`);
    console.log(`   2. ${user2.name} (${user2.email}) - Pass: Password123!`);

    // 3. Crear registros específicos para Carlos (User 1)
    await Setting.create([
      { userId: user1._id, key: 'theme', value: 'dark' },
      { userId: user1._id, key: 'reflection', value: 'Esta semana pude comprobar el impacto de escuchar primero a la comunidad antes de diseñar soluciones. Cada hora cuenta.' }
    ]);

    const todayStr = '2026-10-20';
    const yesterdayStr = '2026-10-19';

    await ServiceTimer.create([
      {
        userId: user1._id,
        date: yesterdayStr,
        startAt: new Date(`${yesterdayStr}T08:00:00`).getTime(),
        endAt: new Date(`${yesterdayStr}T12:00:00`).getTime(),
        hoursWorked: 4,
        notified: true,
        notes: 'Lunes completado en módulo de atención.'
      },
      {
        userId: user1._id,
        date: todayStr,
        startAt: new Date(`${todayStr}T08:30:00`).getTime(),
        notified: false,
        notes: 'Jornada en curso del martes.'
      }
    ]);

    await Activity.create([
      {
        userId: user1._id,
        id: 'carlos-act-01',
        title: 'Taller de lectura comunitaria infantil',
        date: yesterdayStr,
        category: 'Educación',
        start: '09:00',
        end: '11:00',
        priority: 'high',
        notes: 'Se atendieron a 15 niños en la biblioteca municipal.',
        done: true
      },
      {
        userId: user1._id,
        id: 'carlos-act-02',
        title: 'Coordinación y entrega de despensas',
        date: todayStr,
        category: 'Atención comunitaria',
        start: '09:00',
        end: '12:00',
        priority: 'high',
        notes: 'Módulo DIF comunitario centro.',
        done: false
      },
      {
        userId: user1._id,
        id: 'carlos-act-03',
        title: 'Jornada de reforestación en parque',
        date: '2026-10-21',
        category: 'Atención comunitaria',
        start: '08:30',
        end: '11:30',
        priority: 'high',
        notes: 'Plantación de 20 árboles endémicos.',
        done: false
      }
    ]);

    await Reflection.create({
      userId: user1._id,
      id: 'carlos-ref-01',
      date: yesterdayStr,
      title: 'El valor de la empatía en la lectura',
      content: 'Trabajar con niños me retó a ser más paciente y didáctico. Logramos avances importantes.',
      category: 'Educación',
      hoursLogged: 4
    });

    // 4. Crear registros independientes para Sofía (User 2)
    await Setting.create([
      { userId: user2._id, key: 'theme', value: 'light' },
      { userId: user2._id, key: 'reflection', value: 'La alfabetización digital empodera a adultos mayores a comunicarse con sus familias.' }
    ]);

    await ServiceTimer.create({
      userId: user2._id,
      date: todayStr,
      startAt: new Date(`${todayStr}T09:00:00`).getTime(),
      notified: false,
      notes: 'Jornada de Sofía en aula de cómputo'
    });

    await Activity.create([
      {
        userId: user2._id,
        id: 'sofia-act-01',
        title: 'Clase de computación básica para adultos mayores',
        date: todayStr,
        category: 'Educación',
        start: '09:30',
        end: '11:30',
        priority: 'high',
        notes: 'Uso de teclado, correo y videollamadas.',
        done: false
      },
      {
        userId: user2._id,
        id: 'sofia-act-02',
        title: 'Mantenimiento de computadoras de la biblioteca',
        date: '2026-10-21',
        category: 'Gestión',
        start: '10:00',
        end: '12:00',
        priority: 'medium',
        notes: 'Actualización de software y navegadores.',
        done: false
      }
    ]);

    console.log('✅ Actividades, jornadas y bitácoras creadas independientemente para cada usuario.');
    console.log('----------------------------------------------------');
    console.log('✨ Base de datos lista con autenticación y sesiones aisladas.');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar base de datos:', error);
    process.exit(1);
  }
}

seedDatabase();

require('dotenv').config();
const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const ServiceTimer = require('../models/ServiceTimer');
const Setting = require('../models/Setting');
const Reflection = require('../models/Reflection');
const Goal = require('../models/Goal');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapduty';

async function seedDatabase() {
  try {
    console.log('🌱 Conectando a MongoDB para poblar la base de datos...');
    await mongoose.connect(MONGODB_URI);
    console.log(`📦 Conectado a: ${mongoose.connection.name}`);

    // Limpiar colecciones anteriores para tener datos consistentes y funcionales
    await Promise.all([
      Activity.deleteMany({}),
      ServiceTimer.deleteMany({}),
      Reflection.deleteMany({}),
      Goal.deleteMany({}),
      Setting.deleteMany({})
    ]);
    console.log('🧹 Colecciones limpiadas exitosamente.');

    // 1. Crear Metas de Servicio Social
    const defaultGoal = await Goal.create({
      key: 'current',
      dailyHours: 4,
      weeklyHours: 20,
      totalHours: 480, // Meta estándar reglamentaria
      institution: 'Universidad Autónoma',
      programName: 'Programa de Asistencia Comunitaria y Educación SnapDuty'
    });
    console.log('✅ Metas de servicio social configuradas (4h/día, 20h/semana, 480h total).');

    // 2. Configurar Preferencias
    await Setting.create([
      { key: 'theme', value: 'dark' },
      { key: 'reflection', value: 'Esta semana pude comprobar el impacto de escuchar primero a la comunidad antes de diseñar soluciones. Cada hora invertida cuenta.' }
    ]);
    console.log('✅ Ajustes del sistema guardados (Tema oscuro, Reflexión inicial).');

    // 3. Crear Jornadas de Servicio Social (ServiceTimer)
    // Fecha de hoy: 2026-10-20 (martes)
    const today = new Date('2026-10-20T08:30:00');
    const yesterday = new Date('2026-10-19T08:00:00');
    const prevFriday = new Date('2026-10-16T08:00:00');
    const prevThursday = new Date('2026-10-15T08:00:00');

    await ServiceTimer.create([
      {
        date: '2026-10-15',
        startAt: prevThursday.getTime(),
        endAt: prevThursday.getTime() + 4 * 3600000,
        hoursWorked: 4,
        notified: true,
        notes: 'Jornada completada en biblioteca municipal.'
      },
      {
        date: '2026-10-16',
        startAt: prevFriday.getTime(),
        endAt: prevFriday.getTime() + 4 * 3600000,
        hoursWorked: 4,
        notified: true,
        notes: 'Jornada completada en módulo de atención.'
      },
      {
        date: '2026-10-19',
        startAt: yesterday.getTime(),
        endAt: yesterday.getTime() + 4 * 3600000,
        hoursWorked: 4,
        notified: true,
        notes: 'Lunes de servicio social completado: 4 horas.'
      },
      {
        date: '2026-10-20',
        startAt: today.getTime(),
        notified: false,
        notes: 'Jornada en curso de martes.'
      }
    ]);
    console.log('✅ Jornadas de servicio social registradas con cronómetro e historial.');

    // 4. Crear Actividades de Servicio Social (Semana actual y pasada)
    const sampleActivities = [
      // Semana previa
      {
        id: 'act-prev-01',
        title: 'Inducción y bienvenida al programa de servicio',
        date: '2026-10-15',
        category: 'Gestión',
        start: '08:00',
        end: '10:00',
        priority: 'high',
        notes: 'Revisión de reglamentos, firmas y asignación de asesor.',
        done: true
      },
      {
        id: 'act-prev-02',
        title: 'Diagnóstico de necesidades en centro comunitario',
        date: '2026-10-15',
        category: 'Investigación',
        start: '10:30',
        end: '12:00',
        priority: 'medium',
        notes: 'Entrevistas con el personal directivo del centro.',
        done: true
      },
      {
        id: 'act-prev-03',
        title: 'Clasificación de donaciones y despensas',
        date: '2026-10-16',
        category: 'Atención comunitaria',
        start: '08:30',
        end: '12:00',
        priority: 'high',
        notes: 'Armado de 45 paquetes de alimentos para familias vulnerables.',
        done: true
      },

      // Lunes 19 de Octubre (Ayer)
      {
        id: 'act-cur-01',
        title: 'Taller de lectura comunitaria infantil',
        date: '2026-10-19',
        category: 'Educación',
        start: '09:00',
        end: '11:00',
        priority: 'high',
        notes: 'Se atendieron a 15 niños en la biblioteca municipal.',
        done: true
      },
      {
        id: 'act-cur-02',
        title: 'Revisión y registro de asistencia escolar',
        date: '2026-10-19',
        category: 'Gestión',
        start: '11:30',
        end: '13:00',
        priority: 'medium',
        notes: 'Captura de listas de asistencia en el sistema escolar.',
        done: true
      },

      // Martes 20 de Octubre (Hoy)
      {
        id: 'act-cur-03',
        title: 'Coordinación y entrega de despensas',
        date: '2026-10-20',
        category: 'Atención comunitaria',
        start: '09:00',
        end: '12:00',
        priority: 'high',
        notes: 'Módulo DIF comunitario centro. Coordinar con brigadistas.',
        done: false
      },
      {
        id: 'act-cur-04',
        title: 'Diseño de material didáctico para ciencias',
        date: '2026-10-20',
        category: 'Educación',
        start: '12:30',
        end: '14:00',
        priority: 'medium',
        notes: 'Láminas ilustrativas para alumnos de nivel primaria.',
        done: false
      },

      // Miércoles 21 de Octubre (Mañana)
      {
        id: 'act-cur-05',
        title: 'Jornada de reforestación y limpieza en parque',
        date: '2026-10-21',
        category: 'Atención comunitaria',
        start: '08:30',
        end: '11:30',
        priority: 'high',
        notes: 'Plantación de 20 árboles endémicos y limpieza de andadores.',
        done: false
      },
      {
        id: 'act-cur-06',
        title: 'Levantamiento de encuestas vecinales',
        date: '2026-10-21',
        category: 'Investigación',
        start: '12:00',
        end: '13:30',
        priority: 'low',
        notes: 'Zona norte del municipio para medir acceso a servicios básicos.',
        done: false
      },

      // Jueves 22 de Octubre
      {
        id: 'act-cur-07',
        title: 'Clase de regularización de matemáticas',
        date: '2026-10-22',
        category: 'Educación',
        start: '10:00',
        end: '12:00',
        priority: 'high',
        notes: 'Apoyo a 8 alumnos con fracciones y cálculo básico.',
        done: false
      },
      {
        id: 'act-cur-08',
        title: 'Elaboración de informe de avance mensual',
        date: '2026-10-22',
        category: 'Gestión',
        start: '12:30',
        end: '14:00',
        priority: 'low',
        notes: 'Compilación de evidencias fotográficas y firmas de asistencia.',
        done: false
      },

      // Viernes 23 de Octubre
      {
        id: 'act-cur-09',
        title: 'Reunión de evaluación con supervisor institucional',
        date: '2026-10-23',
        category: 'Gestión',
        start: '11:00',
        end: '12:30',
        priority: 'medium',
        notes: 'Firma de bitácora semanal y revisión del cumplimiento de horas.',
        done: false
      }
    ];

    await Activity.insertMany(sampleActivities);
    console.log(`✅ ${sampleActivities.length} actividades creadas para la agenda semanal y calendario.`);

    // 5. Crear Entradas de Bitácora / Reflexiones
    await Reflection.create([
      {
        id: 'ref-01',
        date: '2026-10-16',
        title: 'Primera semana completada: el valor de la empatía',
        content: 'Al principio pensé que el servicio social sería solo trámites administrativos, pero al entregar las despensas pude ver la diferencia real que hace una pequeña ayuda en las familias. Aprendí a escuchar sin juzgar.',
        category: 'Atención comunitaria',
        hoursLogged: 4
      },
      {
        id: 'ref-02',
        date: '2026-10-19',
        title: 'Motivación en el taller de lectura',
        content: 'Trabajar con niños en el taller me retó a ser más paciente y didáctico. Logramos que tres pequeños leyeran su primer cuento completo en voz alta.',
        category: 'Educación',
        hoursLogged: 2
      }
    ]);
    console.log('✅ Entradas de bitácora y reflexiones personales guardadas en MongoDB.');

    console.log('----------------------------------------------------');
    console.log('✨ Base de datos poblada exitosamente con datos funcionales.');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    process.exit(1);
  }
}

seedDatabase();

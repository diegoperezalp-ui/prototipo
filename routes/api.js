const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const ServiceTimer = require('../models/ServiceTimer');
const Setting = require('../models/Setting');
const Reflection = require('../models/Reflection');
const Goal = require('../models/Goal');

// Helper to calculate hours between "HH:mm" and "HH:mm"
function calculateHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
  return diffMinutes > 0 ? Number((diffMinutes / 60).toFixed(2)) : 0;
}

// 1. Health & Connection Status with Collection Metrics
router.get('/status', async (req, res) => {
  try {
    const [actCount, timerCount, reflectCount, goals] = await Promise.all([
      Activity.countDocuments(),
      ServiceTimer.countDocuments(),
      Reflection.countDocuments(),
      Goal.findOne({ key: 'current' }).lean()
    ]);

    res.json({
      status: 'ok',
      database: 'MongoDB',
      connected: true,
      collections: {
        activities: actCount,
        serviceTimers: timerCount,
        reflections: reflectCount
      },
      goals: goals || { dailyHours: 4, weeklyHours: 20, totalHours: 480 },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// 2. Full Bootstrap Data (Loads everything needed for initial render)
router.get('/bootstrap', async (req, res) => {
  try {
    const [activities, timersList, themeSetting, reflectionSetting, goalsDoc, recentReflections] = await Promise.all([
      Activity.find({}).sort({ date: 1, start: 1 }).lean(),
      ServiceTimer.find({}).lean(),
      Setting.findOne({ key: 'theme' }).lean(),
      Setting.findOne({ key: 'reflection' }).lean(),
      Goal.findOne({ key: 'current' }).lean(),
      Reflection.find({}).sort({ date: -1 }).limit(10).lean()
    ]);

    // Format service timers into an object map: { [date]: { startAt, notified, ... } }
    const serviceTimers = {};
    for (const t of timersList) {
      serviceTimers[t.date] = {
        startAt: t.startAt,
        endAt: t.endAt || null,
        hoursWorked: t.hoursWorked || 0,
        notified: !!t.notified,
        notes: t.notes || ''
      };
    }

    res.json({
      success: true,
      data: {
        activities: activities.map(a => ({
          id: a.id,
          title: a.title,
          date: a.date,
          category: a.category,
          start: a.start || "",
          end: a.end || "",
          priority: a.priority,
          notes: a.notes || "",
          done: !!a.done,
          createdAt: a.createdAt
        })),
        serviceTimers,
        theme: themeSetting ? themeSetting.value : null,
        reflection: reflectionSetting ? reflectionSetting.value : "",
        goals: goalsDoc || { dailyHours: 4, weeklyHours: 20, totalHours: 480 },
        reflections: recentReflections
      }
    });
  } catch (error) {
    console.error('Error al obtener bootstrap data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Activities Endpoints (with rich filtering)
router.get('/activities', async (req, res) => {
  try {
    const { date, startDate, endDate, category, status, search } = req.query;
    const filter = {};

    if (date) {
      filter.date = date;
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    if (category && category !== 'all' && category !== 'Todas') {
      filter.category = category;
    }

    if (status === 'done') {
      filter.done = true;
    } else if (status === 'pending') {
      filter.done = false;
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { notes: { $regex: term, $options: 'i' } }
      ];
    }

    const activities = await Activity.find(filter).sort({ date: 1, start: 1 });
    res.json({ success: true, count: activities.length, activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/activities', async (req, res) => {
  try {
    const { id, title, date, category, start, end, priority, notes, done, createdAt } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'El título es obligatorio' });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Fecha inválida (requiere YYYY-MM-DD)' });
    }
    if (Boolean(start) !== Boolean(end)) {
      return res.status(400).json({ success: false, error: 'Completa ambas horas o deja ambas vacías' });
    }
    if (start && end && end <= start) {
      return res.status(400).json({ success: false, error: 'La hora de término debe ser posterior a la de inicio' });
    }

    const activityId = id || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    const activity = await Activity.findOneAndUpdate(
      { id: activityId },
      {
        $set: {
          title: title.trim().slice(0, 120),
          date,
          category: category || 'Otro',
          start: start || '',
          end: end || '',
          priority: priority || 'medium',
          notes: (notes || '').trim().slice(0, 500),
          done: Boolean(done)
        },
        $setOnInsert: {
          id: activityId,
          createdAt: createdAt ? new Date(createdAt) : new Date()
        }
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    res.status(201).json({ success: true, activity });
  } catch (error) {
    console.error('Error al guardar actividad:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/activities/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({ id: req.params.id });
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }
    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, category, start, end, priority, notes, done } = req.body;

    if (title && !title.trim()) {
      return res.status(400).json({ success: false, error: 'El título no puede estar vacío' });
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Fecha inválida' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim().slice(0, 120);
    if (date !== undefined) updateData.date = date;
    if (category !== undefined) updateData.category = category;
    if (start !== undefined) updateData.start = start;
    if (end !== undefined) updateData.end = end;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes.trim().slice(0, 500);
    if (done !== undefined) updateData.done = Boolean(done);

    const activity = await Activity.findOneAndUpdate({ id }, { $set: updateData }, { returnDocument: 'after', runValidators: true });
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    res.json({ success: true, activity });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/activities/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findOne({ id });
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    activity.done = !activity.done;
    await activity.save();

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Activity.findOneAndDelete({ id });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }
    res.json({ success: true, message: 'Actividad eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk sync activities (for importing from local storage without overwriting newer data)
router.post('/activities/bulk-sync', async (req, res) => {
  try {
    const { activities } = req.body;
    if (!Array.isArray(activities)) {
      return res.status(400).json({ success: false, error: 'Se esperaba un arreglo de actividades' });
    }

    const operations = activities.map(act => ({
      updateOne: {
        filter: { id: act.id },
        update: {
          $setOnInsert: {
            id: act.id,
            title: act.title,
            date: act.date,
            category: act.category,
            start: act.start || '',
            end: act.end || '',
            priority: act.priority || 'medium',
            notes: act.notes || '',
            done: !!act.done,
            createdAt: act.createdAt ? new Date(act.createdAt) : new Date()
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await Activity.bulkWrite(operations);
    }

    const all = await Activity.find({}).sort({ date: 1 });
    res.json({ success: true, activities: all });
  } catch (error) {
    console.error('Error en bulk-sync de actividades:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Daily Service Timers Endpoints
router.get('/timers', async (req, res) => {
  try {
    const timers = await ServiceTimer.find({}).sort({ date: 1 });
    if (req.query.format === 'list') {
      return res.json({ success: true, timers });
    }

    const timerMap = {};
    for (const t of timers) {
      timerMap[t.date] = {
        startAt: t.startAt,
        endAt: t.endAt || null,
        hoursWorked: t.hoursWorked || 0,
        notified: t.notified,
        notes: t.notes || ''
      };
    }
    res.json({ success: true, timers: timerMap });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/timers', async (req, res) => {
  try {
    const { date, startAt, endAt, hoursWorked, notified, notes } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Fecha de jornada inválida' });
    }
    if (!startAt || !Number.isFinite(Number(startAt))) {
      return res.status(400).json({ success: false, error: 'Hora de inicio inválida' });
    }

    const timer = await ServiceTimer.findOneAndUpdate(
      { date },
      {
        $set: {
          date,
          startAt: Number(startAt),
          endAt: endAt ? Number(endAt) : null,
          hoursWorked: hoursWorked !== undefined ? Number(hoursWorked) : 0,
          notified: Boolean(notified),
          notes: notes || ''
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(201).json({ success: true, timer });
  } catch (error) {
    console.error('Error al guardar jornada:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/timers/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { notified, startAt, endAt, hoursWorked, notes } = req.body;

    const update = {};
    if (notified !== undefined) update.notified = Boolean(notified);
    if (startAt !== undefined) update.startAt = Number(startAt);
    if (endAt !== undefined) update.endAt = Number(endAt);
    if (hoursWorked !== undefined) update.hoursWorked = Number(hoursWorked);
    if (notes !== undefined) update.notes = String(notes);

    const timer = await ServiceTimer.findOneAndUpdate({ date }, { $set: update }, { returnDocument: 'after' });
    if (!timer) {
      return res.status(404).json({ success: false, error: 'Jornada no encontrada' });
    }

    res.json({ success: true, timer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/timers/:date', async (req, res) => {
  try {
    const { date } = req.params;
    await ServiceTimer.findOneAndDelete({ date });
    res.json({ success: true, message: 'Jornada reiniciada / eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/timers/bulk-sync', async (req, res) => {
  try {
    const { timers } = req.body;
    if (!timers || typeof timers !== 'object') {
      return res.status(400).json({ success: false, error: 'Se esperaba un objeto de jornadas' });
    }

    const operations = Object.entries(timers).map(([date, t]) => ({
      updateOne: {
        filter: { date },
        update: {
          $setOnInsert: {
            date,
            startAt: Number(t.startAt),
            notified: !!t.notified
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await ServiceTimer.bulkWrite(operations);
    }

    const all = await ServiceTimer.find({});
    const timerMap = {};
    for (const t of all) {
      timerMap[t.date] = { startAt: t.startAt, notified: t.notified };
    }
    res.json({ success: true, timers: timerMap });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Settings (Reflection, Theme, Preferences)
router.get('/settings/:key', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    res.json({ success: true, key: req.params.key, value: setting ? setting.value : null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await Setting.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ success: true, setting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 6. Social Service Goals Endpoints
router.get('/goals', async (req, res) => {
  try {
    let goal = await Goal.findOne({ key: 'current' });
    if (!goal) {
      goal = await Goal.create({
        key: 'current',
        dailyHours: 4,
        weeklyHours: 20,
        totalHours: 480,
        programName: 'Servicio Social con Propósito'
      });
    }
    res.json({ success: true, goals: goal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/goals', async (req, res) => {
  try {
    const { dailyHours, weeklyHours, totalHours, institution, programName } = req.body;
    const update = {};
    if (dailyHours !== undefined) update.dailyHours = Number(dailyHours);
    if (weeklyHours !== undefined) update.weeklyHours = Number(weeklyHours);
    if (totalHours !== undefined) update.totalHours = Number(totalHours);
    if (institution !== undefined) update.institution = institution;
    if (programName !== undefined) update.programName = programName;

    const goal = await Goal.findOneAndUpdate(
      { key: 'current' },
      { $set: update },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    res.json({ success: true, goals: goal });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 7. Bitácora / Reflection Journal Endpoints
router.get('/reflections', async (req, res) => {
  try {
    const reflections = await Reflection.find({}).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, count: reflections.length, reflections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reflections', async (req, res) => {
  try {
    const { id, date, title, content, category, hoursLogged } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'El contenido de la reflexión es obligatorio' });
    }

    const reflectionId = id || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const reflection = await Reflection.findOneAndUpdate(
      { id: reflectionId },
      {
        $set: {
          date: date || new Date().toISOString().slice(0, 10),
          title: (title || 'Reflexión de servicio').trim(),
          content: content.trim(),
          category: category || 'General',
          hoursLogged: Number(hoursLogged) || 0
        },
        $setOnInsert: { id: reflectionId }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Also update the global quick reflection setting for backward compatibility
    await Setting.findOneAndUpdate(
      { key: 'reflection' },
      { key: 'reflection', value: content.trim() },
      { upsert: true }
    );

    res.status(201).json({ success: true, reflection });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/reflections/:id', async (req, res) => {
  try {
    const result = await Reflection.findOneAndDelete({ id: req.params.id });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Reflexión no encontrada' });
    }
    res.json({ success: true, message: 'Reflexión eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Real-time Impact Statistics (MongoDB Aggregation Pipeline)
router.get('/stats', async (req, res) => {
  try {
    const [activities, timers, goals] = await Promise.all([
      Activity.find({}).lean(),
      ServiceTimer.find({}).lean(),
      Goal.findOne({ key: 'current' }).lean()
    ]);

    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.done).length;
    const pendingActivities = totalActivities - completedActivities;

    // Calculate hours from activities with start and end
    let totalActivityHours = 0;
    const categoryStats = {
      "Atención comunitaria": { count: 0, hours: 0 },
      "Educación": { count: 0, hours: 0 },
      "Gestión": { count: 0, hours: 0 },
      "Investigación": { count: 0, hours: 0 },
      "Otro": { count: 0, hours: 0 }
    };

    const activeDates = new Set();

    for (const a of activities) {
      activeDates.add(a.date);
      const hrs = calculateHours(a.start, a.end);
      if (a.done) {
        totalActivityHours += hrs;
      }
      const cat = categoryStats[a.category] ? a.category : 'Otro';
      categoryStats[cat].count += 1;
      if (a.done) {
        categoryStats[cat].hours += hrs;
      }
    }

    // Calculate hours from service timers (max 4h per day)
    let totalTimerHours = 0;
    const now = Date.now();
    for (const t of timers) {
      activeDates.add(t.date);
      const elapsed = Math.max(0, now - Number(t.startAt));
      const hours = Math.min(4, elapsed / 3600000);
      totalTimerHours += Number(hours.toFixed(2));
    }

    const currentGoals = goals || { dailyHours: 4, weeklyHours: 20, totalHours: 480 };

    res.json({
      success: true,
      stats: {
        totalActivities,
        completedActivities,
        pendingActivities,
        completionRate: totalActivities > 0 ? Number(((completedActivities / totalActivities) * 100).toFixed(1)) : 0,
        totalActivityHours: Number(totalActivityHours.toFixed(2)),
        totalTimerHours: Number(totalTimerHours.toFixed(2)),
        totalImpactHours: Number((totalActivityHours + totalTimerHours).toFixed(2)),
        activeDaysCount: activeDates.size,
        categoryStats,
        goals: {
          dailyGoal: currentGoals.dailyHours,
          weeklyGoal: currentGoals.weeklyHours,
          totalGoal: currentGoals.totalHours,
          totalProgressPercent: Number(((totalTimerHours / currentGoals.totalHours) * 100).toFixed(1))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Database Backup & Restore Endpoints
router.get('/export', async (req, res) => {
  try {
    const [activities, timers, settings, reflections, goals] = await Promise.all([
      Activity.find({}).lean(),
      ServiceTimer.find({}).lean(),
      Setting.find({}).lean(),
      Reflection.find({}).lean(),
      Goal.findOne({ key: 'current' }).lean()
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      appName: 'SnapDuty',
      version: '1.0.0',
      database: 'MongoDB',
      data: {
        activities,
        serviceTimers: timers,
        settings,
        reflections,
        goals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'Faltan datos para importar' });
    }

    let actImported = 0;
    if (Array.isArray(data.activities)) {
      for (const a of data.activities) {
        if (a.id && a.title && a.date) {
          await Activity.findOneAndUpdate({ id: a.id }, { $set: a }, { upsert: true });
          actImported++;
        }
      }
    }

    let timerImported = 0;
    if (data.serviceTimers) {
      const timersList = Array.isArray(data.serviceTimers)
        ? data.serviceTimers
        : Object.entries(data.serviceTimers).map(([date, val]) => ({ date, ...val }));

      for (const t of timersList) {
        if (t.date && t.startAt) {
          await ServiceTimer.findOneAndUpdate({ date: t.date }, { $set: t }, { upsert: true });
          timerImported++;
        }
      }
    }

    res.json({
      success: true,
      message: 'Datos importados exitosamente',
      imported: { activities: actImported, serviceTimers: timerImported }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

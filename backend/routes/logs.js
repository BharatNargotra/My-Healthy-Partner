import express from 'express';
import DailyLog from '../models/DailyLog.js';
import protect from '../middleware/auth.js';

const router = express.Router();

const normalizeDate = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getOrCreate = async (userId, date) => {
  let log = await DailyLog.findOne({ user: userId, date });
  if (!log) log = await DailyLog.create({ user: userId, date });
  return log;
};

// GET /api/logs/today
router.get('/today', protect, async (req, res) => {
  try {
    const log = await getOrCreate(req.user._id, normalizeDate(new Date()));
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/logs/:date
router.get('/:date', protect, async (req, res) => {
  try {
    const log = await getOrCreate(req.user._id, normalizeDate(req.params.date));
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/logs/exercise
router.post('/exercise', protect, async (req, res) => {
  try {
    const log = await getOrCreate(req.user._id, normalizeDate(new Date()));
    log.exercises.push(req.body);
    await log.save();  // pre-save hook recalculates totals
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/logs/meal
router.post('/meal', protect, async (req, res) => {
  try {
    const log = await getOrCreate(req.user._id, normalizeDate(new Date()));
    log.meals.push(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/logs/today  (vitals update)
router.put('/today', protect, async (req, res) => {
  try {
    const log = await getOrCreate(req.user._id, normalizeDate(new Date()));
    const allowed = ['waterIntake', 'weight', 'mood', 'sleep', 'notes'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) log[f] = req.body[f]; });
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/logs/exercise/:logId/:exerciseId
router.delete('/exercise/:logId/:exerciseId', protect, async (req, res) => {
  try {
    const log = await DailyLog.findOne({ _id: req.params.logId, user: req.user._id });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    log.exercises.id(req.params.exerciseId)?.deleteOne();
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/logs/meal/:logId/:mealId
router.delete('/meal/:logId/:mealId', protect, async (req, res) => {
  try {
    const log = await DailyLog.findOne({ _id: req.params.logId, user: req.user._id });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    log.meals.id(req.params.mealId)?.deleteOne();
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

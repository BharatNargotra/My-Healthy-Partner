import express from 'express';
import DailyLog from '../models/DailyLog.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// GET /api/progress?period=1m|3m|6m
router.get('/', protect, async (req, res) => {
  try {
    const { period = '1m' } = req.query;
    const now = new Date();
    const startDate = new Date();
    if (period === '1m') startDate.setMonth(now.getMonth() - 1);
    else if (period === '3m') startDate.setMonth(now.getMonth() - 3);
    else if (period === '6m') startDate.setMonth(now.getMonth() - 6);

    const logs = await DailyLog.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: now },
    }).sort({ date: 1 });

    const totalDays  = logs.length;
    const activeDays = logs.filter((l) => l.exercises.length > 0).length;
    const totalCaloriesBurned   = logs.reduce((s, l) => s + (l.totalCaloriesBurned || 0), 0);
    const totalCaloriesConsumed = logs.reduce((s, l) => s + (l.totalCaloriesConsumed || 0), 0);
    const avgCaloriesBurned   = totalDays > 0 ? Math.round(totalCaloriesBurned / totalDays) : 0;
    const avgCaloriesConsumed = totalDays > 0 ? Math.round(totalCaloriesConsumed / totalDays) : 0;

    const weightLogs    = logs.filter((l) => l.weight);
    const startWeight   = weightLogs[0]?.weight ?? null;
    const currentWeight = weightLogs[weightLogs.length - 1]?.weight ?? null;
    const weightChange  = startWeight && currentWeight ? +(currentWeight - startWeight).toFixed(1) : null;

    const sleepLogs = logs.filter((l) => l.sleep);
    const avgSleep  = sleepLogs.length > 0
      ? +(sleepLogs.reduce((s, l) => s + l.sleep, 0) / sleepLogs.length).toFixed(1)
      : null;

    // Mood distribution
    const moodDist = logs.reduce((acc, l) => {
      if (l.mood) acc[l.mood] = (acc[l.mood] || 0) + 1;
      return acc;
    }, {});

    // Calendar heat-map data
    const calendarData = {};
    logs.forEach((log) => {
      const key = new Date(log.date).toISOString().split('T')[0];
      calendarData[key] = {
        hasWorkout:       log.exercises.length > 0,
        hasMeal:          log.meals.length > 0,
        caloriesBurned:   log.totalCaloriesBurned,
        caloriesConsumed: log.totalCaloriesConsumed,
        weight:           log.weight,
        mood:             log.mood,
        sleep:            log.sleep,
      };
    });

    // Weekly breakdown
    const weeklyData = [];
    const cursor = new Date(startDate);
    while (cursor <= now) {
      const wEnd = new Date(cursor);
      wEnd.setDate(wEnd.getDate() + 6);
      const wLogs = logs.filter((l) => {
        const d = new Date(l.date);
        return d >= cursor && d <= wEnd;
      });
      if (wLogs.length > 0) {
        weeklyData.push({
          weekStart:   cursor.toISOString().split('T')[0],
          workoutDays: wLogs.filter((l) => l.exercises.length > 0).length,
          avgCalories: Math.round(wLogs.reduce((s, l) => s + l.totalCaloriesConsumed, 0) / wLogs.length),
          totalBurned: wLogs.reduce((s, l) => s + l.totalCaloriesBurned, 0),
        });
      }
      cursor.setDate(cursor.getDate() + 7);
    }

    res.json({
      period, totalDays, activeDays,
      totalCaloriesBurned, totalCaloriesConsumed,
      avgCaloriesBurned, avgCaloriesConsumed,
      startWeight, currentWeight, weightChange,
      avgSleep, moodDist,
      calendarData, weeklyData,
      rawLogs: logs.map((l) => ({
        date:             l.date,
        weight:           l.weight,
        caloriesBurned:   l.totalCaloriesBurned,
        caloriesConsumed: l.totalCaloriesConsumed,
        exerciseCount:    l.exercises.length,
        mood:             l.mood,
        sleep:            l.sleep,
        protein:          l.meals.reduce((s, m) => s + (m.protein || 0), 0),
        carbs:            l.meals.reduce((s, m) => s + (m.carbs || 0), 0),
        fat:              l.meals.reduce((s, m) => s + (m.fat || 0), 0),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

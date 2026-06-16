import express from 'express';
import protect from '../middleware/auth.js';
import User from '../models/User.js';
import DailyLog from '../models/DailyLog.js';
import {
  generateCalorieRecommendation,
  analyzeMeal,
  estimateExerciseCalories,
  generateDailyInsight,
} from '../services/openai.js';

const router = express.Router();

// POST /api/ai/recommend
// Generate (or return cached) daily calorie & macro targets for the user.
router.post('/recommend', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const recommendation = await generateCalorieRecommendation(user);

    // Cache on user doc
    user.aiRecommendation = recommendation;
    await user.save({ validateBeforeSave: false });

    res.json(recommendation);
  } catch (err) {
    console.error('AI recommend error:', err.message);
    res.status(500).json({ message: 'AI service error' });
  }
});

// POST /api/ai/analyze-meal
// { name: "Chicken biryani", quantity: "1 plate" }
router.post('/analyze-meal', protect, async (req, res) => {
  try {
    const { name, quantity } = req.body;
    if (!name) return res.status(400).json({ message: 'Meal name required' });
    const result = await analyzeMeal(name, quantity);
    res.json(result);
  } catch (err) {
    console.error('AI meal error:', err.message);
    res.status(500).json({ message: 'AI service error' });
  }
});

// POST /api/ai/estimate-exercise
// { name: "Running", duration: 30 }
router.post('/estimate-exercise', protect, async (req, res) => {
  try {
    const { name, duration } = req.body;
    if (!name || !duration) return res.status(400).json({ message: 'Name and duration required' });
    const user = await User.findById(req.user._id);
    const result = await estimateExerciseCalories(name, duration, user.weight);
    res.json(result);
  } catch (err) {
    console.error('AI exercise error:', err.message);
    res.status(500).json({ message: 'AI service error' });
  }
});

// GET /api/ai/daily-insight
// Returns a motivational insight for today's log
router.get('/daily-insight', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const log  = await DailyLog.findOne({ user: req.user._id, date: today });
    const user = await User.findById(req.user._id);
    if (!log) return res.json({ insight: 'Start logging today to get your personalized insight!' });
    const insight = await generateDailyInsight(log, user);
    res.json({ insight });
  } catch (err) {
    console.error('AI insight error:', err.message);
    res.status(500).json({ message: 'AI service error' });
  }
});

export default router;

import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  category:      { type: String, enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'], default: 'other' },
  duration:      { type: Number },   // minutes
  sets:          { type: Number },
  reps:          { type: Number },
  weight:        { type: Number },   // kg
  caloriesBurned:{ type: Number, default: 0 },
  notes:         { type: String },
});

const mealSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' },
  calories: { type: Number, default: 0 },
  protein:  { type: Number, default: 0 },  // g
  carbs:    { type: Number, default: 0 },  // g
  fat:      { type: Number, default: 0 },  // g
  quantity: { type: String },
  notes:    { type: String },
});

const dailyLogSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:       { type: Date, required: true },
    exercises:  [exerciseSchema],
    meals:      [mealSchema],
    waterIntake:{ type: Number, default: 0 },  // glasses
    weight:     { type: Number },              // kg daily weigh-in
    mood:       { type: String, enum: ['great', 'good', 'okay', 'bad', 'terrible'], default: 'good' },
    sleep:      { type: Number },              // hours
    notes:      { type: String },
    totalCaloriesConsumed: { type: Number, default: 0 },
    totalCaloriesBurned:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One log per user per day
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

// Recompute totals before every save
dailyLogSchema.pre('save', function (next) {
  this.totalCaloriesConsumed = this.meals.reduce((s, m) => s + (m.calories || 0), 0);
  this.totalCaloriesBurned   = this.exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  next();
});

export default mongoose.model('DailyLog', dailyLogSchema);

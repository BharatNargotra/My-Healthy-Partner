import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: [true, 'Name is required'], trim: true },
    email:         { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password:      { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    age:           { type: Number, min: 1, max: 120 },
    gender:        { type: String, enum: ['male', 'female', 'other'] },
    height:        { type: Number },   // cm
    weight:        { type: Number },   // kg
    targetWeight:  { type: Number },   // kg
    activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], default: 'moderate' },
    primaryGoal:   { type: String, enum: ['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance', 'eat_healthier'], default: 'maintain' },
    dailyCalorieGoal: { type: Number, default: 2000 },
    dailyWaterGoal:   { type: Number, default: 8 },
    // AI-generated recommendation cache
    aiRecommendation: {
      dailyCalories:  { type: Number },
      macros:         { protein: Number, carbs: Number, fat: Number },
      advice:         { type: String },
      generatedAt:    { type: Date },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  const user = this;

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.hash(user.password, 12)
    .then(hash => {
      user.password = hash;
      next();
    })
    .catch(err => next(err));
});

// ── Compare entered password ──────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);

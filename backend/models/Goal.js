import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description:  { type: String, trim: true },
    category:     { type: String, enum: ['weight', 'fitness', 'nutrition', 'lifestyle', 'custom'], default: 'custom' },
    targetValue:  { type: Number },
    currentValue: { type: Number },
    unit:         { type: String },
    targetDate:   { type: Date },
    status:       { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Goal', goalSchema);

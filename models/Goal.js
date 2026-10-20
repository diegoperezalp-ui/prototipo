const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  dailyHours: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  weeklyHours: {
    type: Number,
    required: true,
    min: 1,
    max: 60
  },
  totalHours: {
    type: Number,
    required: true,
    min: 1,
    max: 2000
  },
  institution: String,
  programName: String
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Goal', GoalSchema);

const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'current'
  },
  dailyHours: {
    type: Number,
    required: true,
    default: 4,
    min: 1,
    max: 12
  },
  weeklyHours: {
    type: Number,
    required: true,
    default: 20,
    min: 1,
    max: 60
  },
  totalHours: {
    type: Number,
    required: true,
    default: 480, // Meta reglamentaria común de servicio social
    min: 1,
    max: 2000
  },
  institution: {
    type: String,
    default: ''
  },
  programName: {
    type: String,
    default: 'Servicio Social Comunitario'
  }
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

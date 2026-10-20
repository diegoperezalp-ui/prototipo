const mongoose = require('mongoose');

const ServiceTimerSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'La fecha es obligatoria (YYYY-MM-DD)'],
    unique: true,
    index: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido']
  },
  startAt: {
    type: Number,
    required: [true, 'El timestamp de inicio es obligatorio']
  },
  endAt: {
    type: Number,
    default: null
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  notified: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ""
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

module.exports = mongoose.model('ServiceTimer', ServiceTimerSchema);

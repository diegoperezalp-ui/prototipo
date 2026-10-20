const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  id: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: 120
  },
  date: {
    type: String,
    required: [true, 'La fecha es obligatoria (YYYY-MM-DD)'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido']
  },
  category: {
    type: String,
    enum: ["Atención comunitaria", "Educación", "Gestión", "Investigación", "Otro"],
    default: "Otro"
  },
  start: {
    type: String,
    default: ""
  },
  end: {
    type: String,
    default: ""
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium"
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ""
  },
  done: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
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

// Index for unique activity id per user
ActivitySchema.index({ userId: 1, id: 1 }, { unique: true });
ActivitySchema.index({ userId: 1, date: 1, start: 1 });
ActivitySchema.index({ userId: 1, category: 1 });
ActivitySchema.index({ userId: 1, done: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);

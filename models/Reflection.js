const mongoose = require('mongoose');

const ReflectionSchema = new mongoose.Schema({
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
  date: {
    type: String,
    required: [true, 'La fecha es obligatoria (YYYY-MM-DD)'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido']
  },
  title: {
    type: String,
    default: 'Reflexión semanal'
  },
  content: {
    type: String,
    required: [true, 'El contenido de la reflexión es obligatorio'],
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ["Atención comunitaria", "Educación", "Gestión", "Investigación", "Otro", "General"],
    default: "General"
  },
  hoursLogged: {
    type: Number,
    default: 0
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

ReflectionSchema.index({ userId: 1, id: 1 }, { unique: true });
ReflectionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Reflection', ReflectionSchema);

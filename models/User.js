const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Correo electrónico inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  institution: {
    type: String,
    trim: true,
    default: 'Universidad'
  },
  programName: {
    type: String,
    trim: true,
    default: 'Servicio Social con Propósito'
  },
  avatar: {
    type: String,
    default: ''
  },
  dailyHours: {
    type: Number,
    default: 4,
    min: 1,
    max: 12
  },
  weeklyHours: {
    type: Number,
    default: 20,
    min: 1,
    max: 60
  },
  totalHours: {
    type: Number,
    default: 480,
    min: 1,
    max: 2000
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Middleware hash password antes de guardar
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para verificar contraseña
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

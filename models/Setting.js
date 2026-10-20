const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: null
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

SettingSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Setting', SettingSchema);

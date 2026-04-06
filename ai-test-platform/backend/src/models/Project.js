const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Please add a website URL'],
    match: [/^https?:\/\/.+\..+/, 'Please add a valid URL']
  },
  description: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    viewport: {
      width: { type: Number, default: 1920 },
      height: { type: Number, default: 1080 }
    },
    timeout: { type: Number, default: 30000 },
    retryAttempts: { type: Number, default: 3 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);

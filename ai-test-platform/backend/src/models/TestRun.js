const mongoose = require('mongoose');

const testRunSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  testCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'passed', 'failed', 'error'],
    default: 'pending'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  result: {
    passedSteps: { type: Number, default: 0 },
    failedSteps: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 0 }
  },
  errors: [{
    stepIndex: Number,
    message: String,
    screenshot: String,
    timestamp: { type: Date, default: Date.now }
  }],
  screenshots: [String],
  logs: [String],
  browser: {
    type: String,
    default: 'chrome'
  },
  environment: {
    type: String,
    default: 'local'
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isHealed: {
    type: Boolean,
    default: false
  },
  healedLocators: [{
    originalSelector: String,
    newSelector: String,
    stepIndex: Number
  }]
});

testRunSchema.pre('save', function(next) {
  if (this.startedAt && this.completedAt) {
    this.duration = this.completedAt - this.startedAt;
  }
  next();
});

module.exports = mongoose.model('TestRun', testRunSchema);

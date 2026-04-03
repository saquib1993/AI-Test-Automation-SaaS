const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  testRun: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestRun',
    required: true
  },
  testCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a bug title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a bug description']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'wont_fix'],
    default: 'open'
  },
  stepsToReproduce: [{
    step: String,
    expected: String,
    actual: String
  }],
  evidence: {
    screenshots: [String],
    logs: [String],
    videoUrl: String
  },
  errorMessage: {
    type: String,
    default: ''
  },
  stackTrace: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    type: String,
    default: ''
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

bugReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('BugReport', bugReportSchema);

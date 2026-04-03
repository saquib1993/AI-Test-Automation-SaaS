const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a test case name'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['functional', 'edge', 'ui', 'performance'],
    default: 'functional'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  steps: [{
    action: {
      type: String,
      enum: ['click', 'type', 'validate', 'navigate', 'wait', 'scroll', 'hover'],
      required: true
    },
    selector: {
      type: String,
      required: true
    },
    selectorType: {
      type: String,
      enum: ['id', 'class', 'name', 'xpath', 'css', 'tag'],
      default: 'css'
    },
    value: {
      type: String,
      default: ''
    },
    expectedValue: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  isGenerated: {
    type: Boolean,
    default: false
  },
  aiPrompt: {
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

testCaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TestCase', testCaseSchema);

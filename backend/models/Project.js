const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  expectedEndDate: {
    type: Date,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'delayed', 'completed'],
    default: 'planning'
  },
  budget: {
    estimated: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    breakdown: [{
      category: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      spent: {
        type: Number,
        default: 0
      }
    }]
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['manager', 'supervisor', 'worker'],
      default: 'worker'
    },
    skills: [{
      type: String
    }]
  }],
  resources: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 0
    },
    allocated: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      default: 0
    }
  }],
  timeline: {
    milestones: [{
      title: {
        type: String,
        required: true
      },
      description: String,
      plannedDate: {
        type: Date,
        required: true
      },
      actualDate: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'delayed'],
        default: 'pending'
      }
    }]
  },
  risks: [{
    description: {
      type: String,
      required: true
    },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    mitigation: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['identified', 'mitigated', 'occurred'],
      default: 'identified'
    }
  }],
  progress: {
    completed: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    planned: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  analytics: {
    performanceIndex: {
      type: Number,
      default: 1
    },
    scheduleVariance: {
      type: Number,
      default: 0
    },
    costVariance: {
      type: Number,
      default: 0
    },
    riskIndex: {
      type: Number,
      default: 0
    },
    qualityMetrics: {
      defects: {
        type: Number,
        default: 0
      },
      rework: {
        type: Number,
        default: 0
      },
      compliance: {
        type: Number,
        default: 100
      }
    },
    forecast: {
      completionDate: Date,
      finalCost: Number,
      confidence: {
        type: Number,
        default: 0.95
      },
      delayProbability: {
        type: Number,
        default: 0
      }
    },
    trends: [{
      date: Date,
      progress: Number,
      cost: Number,
      performance: Number,
      resourceUtilization: Number
    }],
    recommendations: [{
      type: {
        type: String,
        required: true
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      impact: {
        schedule: Number,
        cost: Number,
        quality: Number
      },
      status: {
        type: String,
        enum: ['pending', 'implemented', 'rejected'],
        default: 'pending'
      }
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);

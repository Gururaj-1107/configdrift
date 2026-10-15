const mongoose = require('mongoose');

const validationRuleSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    key: {
      type: String,
      required: [true, 'Variable key is required'],
      trim: true
    },
    targetEnvironment: {
      type: String,
      enum: ['all', 'development', 'testing', 'production'],
      default: 'all'
    },
    ruleType: {
      type: String,
      enum: ['required', 'type', 'range', 'regex', 'forbidden_in_env', 'not_equals'],
      required: [true, 'Rule type is required']
    },
    parameters: {
      expectedType:        { type: String },
      minValue:            { type: Number },
      maxValue:            { type: Number },
      pattern:             { type: String },
      forbiddenEnvironment:{ type: String },
      forbiddenValue:      { type: String }
    },
    severity: {
      type: String,
      enum: ['error', 'warning', 'info'],
      default: 'error'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ValidationRule', validationRuleSchema);

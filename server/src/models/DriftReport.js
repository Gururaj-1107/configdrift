const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    key:         { type: String, required: true },
    baseValue:   { type: String, default: null },
    targetValue: { type: String, default: null },
    baseType:    { type: String, default: null },
    targetType:  { type: String, default: null },
    status:      {
      type: String,
      enum: ['MATCH', 'VALUE_MISMATCH', 'TYPE_MISMATCH', 'MISSING_IN_TARGET', 'EXTRA_IN_TARGET'],
      required: true
    },
    severity:    {
      type: String,
      enum: ['ERROR', 'WARNING', 'INFO'],
      required: true
    },
    isSecret:    { type: Boolean, default: false },
    ruleMessages:{ type: [String], default: [] }
  },
  { _id: false }
);

const driftReportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    baseSnapshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Snapshot',
      required: true
    },
    targetSnapshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Snapshot',
      required: true
    },
    baseEnvironment:   { type: String, enum: ['development', 'testing', 'production'] },
    targetEnvironment: { type: String, enum: ['development', 'testing', 'production'] },
    summary: {
      totalKeys:      { type: Number, default: 0 },
      matchedKeys:    { type: Number, default: 0 },
      differingKeys:  { type: Number, default: 0 },
      missingKeys:    { type: Number, default: 0 },
      extraKeys:      { type: Number, default: 0 },
      typeMismatches: { type: Number, default: 0 },
      ruleViolations: { type: Number, default: 0 }
    },
    findings: [findingSchema],
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DriftReport', driftReportSchema);

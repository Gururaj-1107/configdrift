const mongoose = require('mongoose');

const variableSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      default: ''
    },
    dataType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json'],
      default: 'string'
    },
    isSecret: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const snapshotSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    environment: {
      type: String,
      enum: ['development', 'testing', 'production'],
      required: true,
      index: true
    },
    version: {
      type: Number,
      required: true,
      default: 1
    },
    label: {
      type: String,
      trim: true,
      default: ''
    },
    variables: [variableSchema],
    rawSource: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee unique versioning per project & environment
snapshotSchema.index({ project: 1, environment: 1, version: -1 });

module.exports = mongoose.model('Snapshot', snapshotSchema);

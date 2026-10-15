const Snapshot = require('../models/Snapshot');
const Project = require('../models/Project');
const { parseConfig } = require('../services/envParser');

// Helper to verify user owns the project
const verifyProjectOwnership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  if (project.owner.toString() !== userId.toString()) {
    const error = new Error('Not authorized to access snapshots for this project');
    error.statusCode = 403;
    throw error;
  }
  return project;
};

// @desc    Get all snapshots for a project
// @route   GET /api/projects/:projectId/snapshots
// @access  Private
const getSnapshots = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { environment } = req.query;

    await verifyProjectOwnership(projectId, req.user._id);

    const filter = { project: projectId };
    if (environment && ['development', 'testing', 'production'].includes(environment)) {
      filter.environment = environment;
    }

    const snapshots = await Snapshot.find(filter).sort({ environment: 1, version: -1 });

    res.status(200).json({
      success: true,
      count: snapshots.length,
      data: snapshots
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get latest snapshot for each environment of a project
// @route   GET /api/projects/:projectId/snapshots/latest
// @access  Private
const getLatestSnapshots = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await verifyProjectOwnership(projectId, req.user._id);

    const environments = ['development', 'testing', 'production'];
    const latestMap = {};

    for (const env of environments) {
      const latest = await Snapshot.findOne({ project: projectId, environment: env })
        .sort({ version: -1 });
      latestMap[env] = latest || null;
    }

    res.status(200).json({
      success: true,
      data: latestMap
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single snapshot by ID
// @route   GET /api/projects/:projectId/snapshots/:id
// @access  Private
const getSnapshotById = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    await verifyProjectOwnership(projectId, req.user._id);

    const snapshot = await Snapshot.findOne({ _id: id, project: projectId });
    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found'
      });
    }

    res.status(200).json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new environment snapshot
// @route   POST /api/projects/:projectId/snapshots
// @access  Private
const createSnapshot = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { environment, format = 'dotenv', rawText = '', variables = [], label = '' } = req.body;

    await verifyProjectOwnership(projectId, req.user._id);

    if (!environment || !['development', 'testing', 'production'].includes(environment)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid environment. Must be development, testing, or production.'
      });
    }

    // Parse configuration input
    let parsedVariables = [];
    if (format === 'structured' && Array.isArray(variables) && variables.length > 0) {
      parsedVariables = parseConfig('structured', variables);
    } else if (rawText && typeof rawText === 'string') {
      parsedVariables = parseConfig(format, rawText);
    } else if (Array.isArray(variables)) {
      parsedVariables = parseConfig('structured', variables);
    }

    // Determine the next version number for this environment
    const latestSnapshot = await Snapshot.findOne({
      project: projectId,
      environment
    }).sort({ version: -1 });

    const nextVersion = latestSnapshot ? latestSnapshot.version + 1 : 1;

    const newSnapshot = await Snapshot.create({
      project: projectId,
      environment,
      version: nextVersion,
      label: label.trim(),
      variables: parsedVariables,
      rawSource: typeof rawText === 'string' ? rawText : JSON.stringify(variables),
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: newSnapshot
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a snapshot
// @route   DELETE /api/projects/:projectId/snapshots/:id
// @access  Private
const deleteSnapshot = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    await verifyProjectOwnership(projectId, req.user._id);

    const snapshot = await Snapshot.findOneAndDelete({ _id: id, project: projectId });
    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Snapshot removed successfully'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getSnapshots,
  getLatestSnapshots,
  getSnapshotById,
  createSnapshot,
  deleteSnapshot
};

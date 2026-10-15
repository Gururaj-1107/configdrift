const ValidationRule = require('../models/ValidationRule');
const Project = require('../models/Project');

const verifyOwnership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  if (project.owner.toString() !== userId.toString()) {
    const err = new Error('Not authorized to access this project');
    err.statusCode = 403;
    throw err;
  }
  return project;
};

const VALID_RULE_TYPES = ['required', 'type', 'range', 'regex', 'forbidden_in_env', 'not_equals'];

// @desc    Get all rules for a project
// @route   GET /api/projects/:projectId/rules
const getRules = async (req, res) => {
  try {
    await verifyOwnership(req.params.projectId, req.user._id);
    const rules = await ValidationRule.find({ project: req.params.projectId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Create a validation rule
// @route   POST /api/projects/:projectId/rules
const createRule = async (req, res) => {
  try {
    const { projectId } = req.params;
    await verifyOwnership(projectId, req.user._id);

    const { key, ruleType, targetEnvironment = 'all', parameters = {}, severity = 'error', description = '' } = req.body;

    if (!key || !key.trim()) {
      return res.status(400).json({ success: false, message: 'Variable key is required' });
    }
    if (!VALID_RULE_TYPES.includes(ruleType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ruleType. Must be one of: ${VALID_RULE_TYPES.join(', ')}`
      });
    }

    const rule = await ValidationRule.create({
      project: projectId,
      key: key.trim(),
      ruleType,
      targetEnvironment,
      parameters,
      severity,
      description: description.trim()
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Update a validation rule
// @route   PUT /api/projects/:projectId/rules/:ruleId
const updateRule = async (req, res) => {
  try {
    const { projectId, ruleId } = req.params;
    await verifyOwnership(projectId, req.user._id);

    const rule = await ValidationRule.findOne({ _id: ruleId, project: projectId });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

    const { ruleType, targetEnvironment, parameters, severity, description } = req.body;

    if (ruleType && !VALID_RULE_TYPES.includes(ruleType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ruleType. Must be one of: ${VALID_RULE_TYPES.join(', ')}`
      });
    }

    if (ruleType)           rule.ruleType           = ruleType;
    if (targetEnvironment)  rule.targetEnvironment  = targetEnvironment;
    if (parameters)         rule.parameters         = { ...rule.parameters, ...parameters };
    if (severity)           rule.severity           = severity;
    if (description !== undefined) rule.description = description.trim();

    await rule.save();
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a validation rule
// @route   DELETE /api/projects/:projectId/rules/:ruleId
const deleteRule = async (req, res) => {
  try {
    const { projectId, ruleId } = req.params;
    await verifyOwnership(projectId, req.user._id);

    const rule = await ValidationRule.findOneAndDelete({ _id: ruleId, project: projectId });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

    res.status(200).json({ success: true, message: 'Validation rule removed successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = { getRules, createRule, updateRule, deleteRule };

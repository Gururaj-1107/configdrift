const Snapshot = require('../models/Snapshot');
const Project = require('../models/Project');
const DriftReport = require('../models/DriftReport');
const ValidationRule = require('../models/ValidationRule');
const { compareSnapshots } = require('../services/comparisonEngine');

// Helper: verify the requesting user owns the project
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

// @desc    Run live comparison between two snapshots (not persisted)
// @route   POST /api/projects/:projectId/compare
// @access  Private
const runComparison = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { baseSnapshotId, targetSnapshotId } = req.body;

    await verifyOwnership(projectId, req.user._id);

    if (!baseSnapshotId || !targetSnapshotId) {
      return res.status(400).json({
        success: false,
        message: 'Both baseSnapshotId and targetSnapshotId are required'
      });
    }

    if (baseSnapshotId === targetSnapshotId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot compare a snapshot with itself'
      });
    }

    const [base, target] = await Promise.all([
      Snapshot.findOne({ _id: baseSnapshotId, project: projectId }),
      Snapshot.findOne({ _id: targetSnapshotId, project: projectId })
    ]);

    if (!base) return res.status(404).json({ success: false, message: 'Base snapshot not found' });
    if (!target) return res.status(404).json({ success: false, message: 'Target snapshot not found' });

    // Load applicable validation rules
    const rules = await ValidationRule.find({ project: projectId });

    const result = compareSnapshots(base, target, rules);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Save a comparison result as a persisted DriftReport
// @route   POST /api/projects/:projectId/reports
// @access  Private
const saveReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { baseSnapshotId, targetSnapshotId } = req.body;

    await verifyOwnership(projectId, req.user._id);

    if (!baseSnapshotId || !targetSnapshotId) {
      return res.status(400).json({
        success: false,
        message: 'Both baseSnapshotId and targetSnapshotId are required'
      });
    }

    const [base, target] = await Promise.all([
      Snapshot.findOne({ _id: baseSnapshotId, project: projectId }),
      Snapshot.findOne({ _id: targetSnapshotId, project: projectId })
    ]);

    if (!base) return res.status(404).json({ success: false, message: 'Base snapshot not found' });
    if (!target) return res.status(404).json({ success: false, message: 'Target snapshot not found' });

    const rules = await ValidationRule.find({ project: projectId });
    const result = compareSnapshots(base, target, rules);

    const report = await DriftReport.create({
      project:           projectId,
      baseSnapshot:      base._id,
      targetSnapshot:    target._id,
      baseEnvironment:   base.environment,
      targetEnvironment: target.environment,
      summary:           result.summary,
      findings:          result.findings,
      generatedBy:       req.user._id
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all drift reports for a project
// @route   GET /api/projects/:projectId/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const { projectId } = req.params;
    await verifyOwnership(projectId, req.user._id);

    const reports = await DriftReport.find({ project: projectId })
      .sort({ createdAt: -1 })
      .populate('baseSnapshot', 'environment version label')
      .populate('targetSnapshot', 'environment version label')
      .populate('generatedBy', 'name');

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single drift report by ID
// @route   GET /api/projects/:projectId/reports/:reportId
// @access  Private
const getReportById = async (req, res) => {
  try {
    const { projectId, reportId } = req.params;
    await verifyOwnership(projectId, req.user._id);

    const report = await DriftReport.findOne({ _id: reportId, project: projectId })
      .populate('baseSnapshot', 'environment version label variables')
      .populate('targetSnapshot', 'environment version label variables')
      .populate('generatedBy', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export a drift report as JSON or CSV
// @route   GET /api/projects/:projectId/reports/:reportId/export?format=json|csv
// @access  Private
const exportReport = async (req, res) => {
  try {
    const { projectId, reportId } = req.params;
    const { format = 'json' } = req.query;

    await verifyOwnership(projectId, req.user._id);

    const report = await DriftReport.findOne({ _id: reportId, project: projectId })
      .populate('baseSnapshot', 'environment version label')
      .populate('targetSnapshot', 'environment version label')
      .populate('generatedBy', 'name');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (format === 'csv') {
      const csvRows = [
        'Key,Base Environment,Base Value,Target Environment,Target Value,Status,Severity,Is Secret,Rule Messages',
        ...report.findings.map((f) => {
          const baseVal   = f.isSecret ? '••••••••' : (f.baseValue   ?? '');
          const targetVal = f.isSecret ? '••••••••' : (f.targetValue ?? '');
          const msgs = (f.ruleMessages || []).join('; ').replace(/,/g, ' |');
          return [
            `"${f.key}"`,
            `"${report.baseEnvironment}"`,
            `"${baseVal}"`,
            `"${report.targetEnvironment}"`,
            `"${targetVal}"`,
            `"${f.status}"`,
            `"${f.severity}"`,
            `"${f.isSecret}"`,
            `"${msgs}"`
          ].join(',');
        })
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="drift-report-${report._id}.csv"`
      );
      return res.send(csvRows);
    }

    // Default JSON export — mask secret values
    const sanitizedFindings = report.findings.map((f) => {
      const plain = f.toObject ? f.toObject() : f;
      return {
        ...plain,
        baseValue:   f.isSecret ? '••••••••' : f.baseValue,
        targetValue: f.isSecret ? '••••••••' : f.targetValue,
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="drift-report-${report._id}.json"`
    );

    return res.json({
      reportId:          report._id,
      project:           projectId,
      generatedAt:       report.createdAt,
      generatedBy:       report.generatedBy?.name,
      baseEnvironment:   report.baseEnvironment,
      targetEnvironment: report.targetEnvironment,
      summary:           report.summary,
      findings:          sanitizedFindings
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a saved drift report
// @route   DELETE /api/projects/:projectId/reports/:reportId
// @access  Private
const deleteReport = async (req, res) => {
  try {
    const { projectId, reportId } = req.params;
    await verifyOwnership(projectId, req.user._id);

    const report = await DriftReport.findOneAndDelete({ _id: reportId, project: projectId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Drift report not found' });
    }

    res.status(200).json({ success: true, message: 'Drift report deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  runComparison,
  saveReport,
  getReports,
  getReportById,
  exportReport,
  deleteReport
};

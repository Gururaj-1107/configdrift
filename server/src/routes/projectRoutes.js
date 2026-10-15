const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All project routes require authentication

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

const snapshotRoutes = require('./snapshotRoutes');
const comparisonRoutes = require('./comparisonRoutes');
const validationRuleRoutes = require('./validationRuleRoutes');

// Nested routes
router.use('/:projectId/snapshots', snapshotRoutes);
router.use('/:projectId/rules', validationRuleRoutes);
router.use('/:projectId', comparisonRoutes);

module.exports = router;

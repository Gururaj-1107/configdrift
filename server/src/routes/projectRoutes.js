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

// Nested Snapshot routes
router.use('/:projectId/snapshots', snapshotRoutes);

module.exports = router;

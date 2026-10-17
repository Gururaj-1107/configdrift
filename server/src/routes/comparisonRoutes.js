const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  runComparison,
  saveReport,
  getReports,
  getReportById,
  exportReport,
  deleteReport
} = require('../controllers/comparisonController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/compare', runComparison);
router.route('/reports')
  .post(saveReport)
  .get(getReports);

router.route('/reports/:reportId')
  .get(getReportById)
  .delete(deleteReport);

router.get('/reports/:reportId/export', exportReport);

module.exports = router;

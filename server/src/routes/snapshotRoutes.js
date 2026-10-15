const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getSnapshots,
  getLatestSnapshots,
  getSnapshotById,
  createSnapshot,
  deleteSnapshot
} = require('../controllers/snapshotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSnapshots)
  .post(createSnapshot);

router.route('/latest')
  .get(getLatestSnapshots);

router.route('/:id')
  .get(getSnapshotById)
  .delete(deleteSnapshot);

module.exports = router;

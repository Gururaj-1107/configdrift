const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getRules,
  createRule,
  updateRule,
  deleteRule
} = require('../controllers/validationRuleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getRules)
  .post(createRule);

router.route('/:ruleId')
  .put(updateRule)
  .delete(deleteRule);

module.exports = router;

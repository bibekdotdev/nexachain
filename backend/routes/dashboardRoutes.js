const express = require('express');
const {
  getDashboardSummary,
  getRoiHistory,
  getReferralIncomeHistory,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getDashboardSummary);
router.get('/roi-history', getRoiHistory);
router.get('/referral-income', getReferralIncomeHistory);

module.exports = router;

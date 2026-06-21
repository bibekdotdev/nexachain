const express = require('express');
const { getDirectReferrals, getReferralTree } = require('../controllers/referralController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/direct', getDirectReferrals);
router.get('/tree', getReferralTree);

module.exports = router;

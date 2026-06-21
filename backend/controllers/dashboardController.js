const asyncHandler = require('express-async-handler');
const Investment = require('../models/Investment');
const RoiHistory = require('../models/RoiHistory');
const ReferralIncome = require('../models/ReferralIncome');

// @desc    Get dashboard summary for the logged-in user
// @route   GET /api/dashboard
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [investmentAgg, todayRoiAgg, referralCount] = await Promise.all([
    Investment.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: '$amount' },
          activeInvestments: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
          },
          totalInvestments: { $sum: 1 },
        },
      },
    ]),
    RoiHistory.aggregate([
      {
        $match: {
          user: userId,
          roiDate: {
            $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
          },
        },
      },
      { $group: { _id: null, todayRoi: { $sum: '$amount' } } },
    ]),
    require('../models/User').countDocuments({ referredBy: userId }),
  ]);

  res.json({
    success: true,
    data: {
      walletBalance: req.user.walletBalance,
      totalRoiEarned: req.user.totalRoiEarned,
      totalLevelIncomeEarned: req.user.totalLevelIncomeEarned,
      todayRoi: todayRoiAgg[0]?.todayRoi || 0,
      totalInvested: investmentAgg[0]?.totalInvested || 0,
      totalInvestments: investmentAgg[0]?.totalInvestments || 0,
      activeInvestments: investmentAgg[0]?.activeInvestments || 0,
      directReferrals: referralCount,
    },
  });
});

// @desc    Get ROI history for the logged-in user
// @route   GET /api/dashboard/roi-history
// @access  Private
const getRoiHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const [history, total] = await Promise.all([
    RoiHistory.find({ user: req.user._id })
      .populate('investment', 'planName amount')
      .sort({ roiDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    RoiHistory.countDocuments({ user: req.user._id }),
  ]);

  res.json({
    success: true,
    data: history,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get referral/level income history for the logged-in user
// @route   GET /api/dashboard/referral-income
// @access  Private
const getReferralIncomeHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const [history, total] = await Promise.all([
    ReferralIncome.find({ receiver: req.user._id })
      .populate('generator', 'fullName email')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ReferralIncome.countDocuments({ receiver: req.user._id }),
  ]);

  res.json({
    success: true,
    data: history,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

module.exports = { getDashboardSummary, getRoiHistory, getReferralIncomeHistory };

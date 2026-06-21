const asyncHandler = require('express-async-handler');
const Investment = require('../models/Investment');

const DEFAULT_DAILY_ROI = parseFloat(process.env.DEFAULT_DAILY_ROI_PERCENT || '1');

// @desc    Create a new investment for the logged-in user
// @route   POST /api/investments
// @access  Private
// body: { amount, planName, planDurationDays, dailyRoiPercent? }
const createInvestment = asyncHandler(async (req, res) => {
  const { amount, planName, planDurationDays, dailyRoiPercent } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Investment amount must be greater than 0');
  }
  if (!planName || !planDurationDays || planDurationDays <= 0) {
    res.status(400);
    throw new Error('Plan name and a valid duration (days) are required');
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + planDurationDays);

  const investment = await Investment.create({
    user: req.user._id,
    amount,
    planName,
    planDurationDays,
    dailyRoiPercent: dailyRoiPercent ?? DEFAULT_DAILY_ROI,
    startDate,
    endDate,
    status: 'Active',
  });

  res.status(201).json({ success: true, data: investment });
});

// @desc    Get all investments for the logged-in user
// @route   GET /api/investments
// @access  Private
const getMyInvestments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const [investments, total] = await Promise.all([
    Investment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Investment.countDocuments({ user: req.user._id }),
  ]);

  res.json({
    success: true,
    data: investments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

module.exports = { createInvestment, getMyInvestments };

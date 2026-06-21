const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get direct (level 1) referrals of the logged-in user
// @route   GET /api/referrals/direct
// @access  Private
const getDirectReferrals = asyncHandler(async (req, res) => {
  const referrals = await User.find({ referredBy: req.user._id })
    .select('fullName email mobile status walletBalance createdAt')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: referrals.length, data: referrals });
});

const MAX_TREE_DEPTH = parseInt(process.env.MAX_REFERRAL_LEVELS || '5', 10);

/**
 * Recursively builds a nested referral tree starting at `userId`.
 * Depth is capped via MAX_TREE_DEPTH to avoid runaway recursion / huge payloads.
 */
async function buildReferralTree(userId, depth = 1) {
  if (depth > MAX_TREE_DEPTH) return [];

  const children = await User.find({ referredBy: userId }).select(
    'fullName email status walletBalance totalRoiEarned createdAt'
  );

  const tree = [];
  for (const child of children) {
    const grandChildren = await buildReferralTree(child._id, depth + 1);
    tree.push({
      _id: child._id,
      fullName: child.fullName,
      email: child.email,
      status: child.status,
      walletBalance: child.walletBalance,
      totalRoiEarned: child.totalRoiEarned,
      level: depth,
      children: grandChildren,
    });
  }
  return tree;
}

// @desc    Get the complete nested referral tree of the logged-in user
// @route   GET /api/referrals/tree
// @access  Private
const getReferralTree = asyncHandler(async (req, res) => {
  const tree = await buildReferralTree(req.user._id);
  res.json({ success: true, data: tree });
});

module.exports = { getDirectReferrals, getReferralTree };

const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncome');

// e.g. "10,5,3,2,1" -> [10, 5, 3, 2, 1] (percent per level, level 1 = direct sponsor)
const LEVEL_PERCENTS = (process.env.REFERRAL_LEVEL_PERCENTS || '10,5,3,2,1')
  .split(',')
  .map((n) => parseFloat(n.trim()));

const MAX_LEVELS = parseInt(process.env.MAX_REFERRAL_LEVELS || LEVEL_PERCENTS.length, 10);

/**
 * Walks up the referral chain from `investorUserId` and credits level income
 * to each ancestor based on the ROI amount that was just paid out.
 *
 * Idempotency: relies on the unique compound index on ReferralIncome
 * (receiver + sourceRoiHistory + level). If this function is called twice
 * for the same roiHistoryId, the second insert attempt per level will throw
 * a duplicate-key error which we catch and skip, so no double-crediting occurs.
 *
 * @param {Object} params
 * @param {String} params.investorUserId - the user whose investment earned ROI
 * @param {Number} params.roiAmount - the ROI amount just credited
 * @param {String} params.investmentId
 * @param {String} params.roiHistoryId
 * @param {import('mongoose').ClientSession} [session] - optional mongoose session for transactions
 */
async function distributeLevelIncome({
  investorUserId,
  roiAmount,
  investmentId,
  roiHistoryId,
  session,
}) {
  let currentUser = await User.findById(investorUserId).session(session || null);
  let level = 1;
  const results = [];

  while (currentUser && currentUser.referredBy && level <= MAX_LEVELS) {
    const percent = LEVEL_PERCENTS[level - 1];

    // If no percent configured for this level, stop traversing further up
    if (percent === undefined) break;

    const upline = await User.findById(currentUser.referredBy).session(session || null);
    if (!upline) break;

    const incomeAmount = Number(((roiAmount * percent) / 100).toFixed(2));

    if (incomeAmount > 0 && upline.status === 'Active') {
      try {
        await ReferralIncome.create(
          [
            {
              receiver: upline._id,
              generator: investorUserId,
              sourceInvestment: investmentId,
              sourceRoiHistory: roiHistoryId,
              level,
              amount: incomeAmount,
            },
          ],
          { session }
        );

        upline.walletBalance += incomeAmount;
        upline.totalLevelIncomeEarned += incomeAmount;
        await upline.save({ session });

        results.push({ receiver: upline._id, level, amount: incomeAmount });
      } catch (err) {
        // Duplicate key (11000) means this level income was already credited
        // in a prior run for this exact ROI event -> safe to ignore.
        if (err.code !== 11000) throw err;
      }
    }

    currentUser = upline;
    level += 1;
  }

  return results;
}

module.exports = { distributeLevelIncome, LEVEL_PERCENTS, MAX_LEVELS };

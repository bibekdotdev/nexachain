const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const RoiHistory = require('../models/RoiHistory');
const User = require('../models/User');
const { distributeLevelIncome } = require('./referralService');

/** Normalizes a date to UTC midnight so "roiDate" is a clean calendar-day key. */
function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Processes daily ROI for ALL active investments that have not yet been
 * processed for today's calendar date.
 *
 * Idempotency strategy (two layers):
 *  1. Investment.lastRoiProcessedDate is checked up-front to skip investments
 *     already handled today.
 *  2. RoiHistory has a unique index on (investment, roiDate) as a hard
 *     database-level guarantee: even if two cron instances race, only one
 *     RoiHistory row can be inserted per investment per day. The duplicate
 *     insert throws (code 11000) and is caught/skipped per-investment so a
 *     single duplicate doesn't crash the whole batch.
 *
 * Each investment is processed inside its own Mongo transaction so that
 * wallet credit + ROI history + level income distribution either all
 * succeed or all roll back together.
 */
async function processDailyRoi() {
  const roiDate = todayUTC();
  const now = new Date();

  const dueInvestments = await Investment.find({
    status: 'Active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { lastRoiProcessedDate: null },
      { lastRoiProcessedDate: { $lt: roiDate } },
    ],
  });

  const summary = { processed: 0, skipped: 0, failed: 0, totalCredited: 0 };

  for (const investment of dueInvestments) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const roiAmount = Number(
          ((investment.amount * investment.dailyRoiPercent) / 100).toFixed(2)
        );

        // Layer 2 guard: unique index throws if this (investment, roiDate)
        // pair was already inserted by a previous/overlapping run.
        const [roiRecord] = await RoiHistory.create(
          [
            {
              user: investment.user,
              investment: investment._id,
              amount: roiAmount,
              roiDate,
              status: 'Credited',
            },
          ],
          { session }
        );

        const user = await User.findById(investment.user).session(session);
        if (!user) throw new Error(`User ${investment.user} not found`);

        user.walletBalance += roiAmount;
        user.totalRoiEarned += roiAmount;
        await user.save({ session });

        investment.totalRoiPaid += roiAmount;
        investment.lastRoiProcessedDate = roiDate;

        // Auto-complete investment if its end date has passed
        if (investment.endDate <= now) {
          investment.status = 'Completed';
        }
        await investment.save({ session });

        // Distribute multi-level referral income off the back of this ROI event
        await distributeLevelIncome({
          investorUserId: investment.user,
          roiAmount,
          investmentId: investment._id,
          roiHistoryId: roiRecord._id,
          session,
        });

        summary.processed += 1;
        summary.totalCredited += roiAmount;
      });
    } catch (err) {
      if (err.code === 11000) {
        // Already processed today by another run -> not an error, just skip.
        summary.skipped += 1;
      } else {
        console.error(`ROI processing failed for investment ${investment._id}:`, err.message);
        summary.failed += 1;
      }
    } finally {
      session.endSession();
    }
  }

  return summary;
}

module.exports = { processDailyRoi };

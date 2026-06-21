const mongoose = require('mongoose');

const referralIncomeSchema = new mongoose.Schema(
  {
    receiver: {
      // user who receives the income
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    generator: {
      // user whose investment/ROI generated the income
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sourceInvestment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: true,
    },
    sourceRoiHistory: {
      // links back to the specific ROI payout that triggered this level income,
      // used as the idempotency key (one level-income row per receiver+roiHistory+level)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoiHistory',
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevents the same level-income from being credited twice for the same ROI event
referralIncomeSchema.index(
  { receiver: 1, sourceRoiHistory: 1, level: 1 },
  { unique: true }
);

referralIncomeSchema.index({ receiver: 1, date: -1 });

module.exports = mongoose.model('ReferralIncome', referralIncomeSchema);

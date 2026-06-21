const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: [1, 'Investment amount must be greater than 0'],
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planDurationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    dailyRoiPercent: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled'],
      default: 'Active',
      index: true,
    },
    totalRoiPaid: {
      type: Number,
      default: 0,
    },
    lastRoiProcessedDate: {
      // used by the cron job to guarantee idempotency
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Speeds up the cron job's "find all active investments due for ROI today" query
investmentSchema.index({ status: 1, lastRoiProcessedDate: 1 });

module.exports = mongoose.model('Investment', investmentSchema);

const mongoose = require('mongoose');

const roiHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    roiDate: {
      // the calendar date (normalized to midnight UTC) this ROI is FOR,
      // not the timestamp the job happened to run at
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Credited', 'Failed'],
      default: 'Credited',
    },
  },
  { timestamps: true }
);

// Core idempotency guard: a given investment can only have ONE roi history
// row per calendar day, regardless of how many times the cron fires.
roiHistorySchema.index({ investment: 1, roiDate: 1 }, { unique: true });
roiHistorySchema.index({ user: 1, roiDate: -1 });

module.exports = mongoose.model('RoiHistory', roiHistorySchema);

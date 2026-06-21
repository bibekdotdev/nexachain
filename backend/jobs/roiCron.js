const cron = require('node-cron');
const { processDailyRoi } = require('../services/roiService');

/**
 * Runs every day at 12:00 AM server time.
 * Idempotency is enforced inside roiService (unique index + status check),
 * so even if this fires twice (e.g. server restart near midnight, or a
 * manual re-trigger), ROI will never be credited twice for the same day.
 */
function startRoiCronJob() {
  // Cron format: second(optional) minute hour day month weekday
  cron.schedule('0 0 * * *', async () => {
    console.log(`[ROI CRON] Starting daily ROI run at ${new Date().toISOString()}`);
    try {
      const summary = await processDailyRoi();
      console.log('[ROI CRON] Completed:', summary);
    } catch (err) {
      console.error('[ROI CRON] Fatal error during ROI run:', err);
    }
  });

  console.log('[ROI CRON] Scheduler registered: runs daily at 12:00 AM');
}

module.exports = { startRoiCronJob };

import cron from 'node-cron';
import { updateStandings } from './standingsUpdater.js';

/**
 * Schedule daily standings update at 3 AM EST
 * EST is UTC-5, so 3 AM EST = 8 AM UTC
 * EDT is UTC-4, so 3 AM EDT = 7 AM UTC
 * Using 8 AM UTC (covers EST) - adjust if needed for daylight saving
 */
const CRON_SCHEDULE = '0 8 * * *'; // 8 AM UTC = 3 AM EST (winter) or 4 AM EDT (summer)

let standingsUpdateJob = null;

/**
 * Initialize and start the cron scheduler
 */
export const startCronScheduler = () => {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏭️  Cron scheduler disabled (not in production mode)');
    return;
  }

  // Check if cron is already running
  if (standingsUpdateJob) {
    console.log('⚠️  Cron scheduler already running');
    return;
  }

  try {
    // Validate cron schedule
    if (!cron.validate(CRON_SCHEDULE)) {
      throw new Error(`Invalid cron schedule: ${CRON_SCHEDULE}`);
    }

    // Schedule the job
    standingsUpdateJob = cron.schedule(CRON_SCHEDULE, async () => {
      console.log('⏰ Cron job triggered: Starting scheduled standings update...');
      await updateStandings();
    }, {
      scheduled: true,
      timezone: 'America/New_York', // EST/EDT timezone
    });

    console.log('✅ Cron scheduler started successfully');
    console.log(`   Schedule: Daily at 3 AM EST/EDT (${CRON_SCHEDULE} UTC)`);
    console.log('   Next run will be automatically scheduled');
  } catch (error) {
    console.error('❌ Failed to start cron scheduler:', error);
    throw error;
  }
};

/**
 * Stop the cron scheduler
 */
export const stopCronScheduler = () => {
  if (standingsUpdateJob) {
    standingsUpdateJob.stop();
    standingsUpdateJob = null;
    console.log('🛑 Cron scheduler stopped');
  }
};

/**
 * Get cron scheduler status
 */
export const getCronStatus = () => {
  return {
    running: standingsUpdateJob !== null,
    schedule: CRON_SCHEDULE,
    timezone: 'America/New_York',
    nextRun: standingsUpdateJob ? 'Scheduled' : 'Not scheduled',
  };
};


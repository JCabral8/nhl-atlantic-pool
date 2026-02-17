import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = (await import('./app.js')).default;

app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Accepting requests from ${FRONTEND_URL}`);

  try {
    const { startCronScheduler } = await import('./services/cronScheduler.js');
    startCronScheduler();
  } catch (error) {
    console.warn('⚠️  Could not start cron scheduler (node-cron may not be installed):', error.message);
    console.warn('   Server will continue running, but automatic standings updates will be disabled.');
  }
});

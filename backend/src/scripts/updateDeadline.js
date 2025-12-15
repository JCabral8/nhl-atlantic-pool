import { dbQuery } from '../database/dbAdapter.js';

// New deadline value (Eastern time, matching config convention)
const NEW_DEADLINE = '2025-12-17T23:59:59-05:00';

async function main() {
  try {
    const result = await dbQuery.run(
      'INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      ['deadline', NEW_DEADLINE]
    );
    console.log('✅ Deadline updated to', NEW_DEADLINE, 'changes:', result.changes ?? 'n/a');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update deadline:', error);
    process.exit(1);
  }
}

main();



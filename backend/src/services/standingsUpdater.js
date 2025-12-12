import axios from 'axios';
import { dbQuery } from '../database/dbAdapter.js';

// NHL API endpoint
const NHL_API_BASE = 'https://statsapi.web.nhl.com/api/v1';

// Map NHL API team names to database team names
// NHL API uses full names like "Tampa Bay Lightning"
const TEAM_NAME_MAP = {
  'Tampa Bay Lightning': 'Tampa Bay Lightning',
  'Boston Bruins': 'Boston Bruins',
  'Detroit Red Wings': 'Detroit Red Wings',
  'Montreal Canadiens': 'Montreal Canadiens',
  'Toronto Maple Leafs': 'Toronto Maple Leafs',
  'Florida Panthers': 'Florida Panthers',
  'Ottawa Senators': 'Ottawa Senators',
  'Buffalo Sabres': 'Buffalo Sabres',
};

// Atlantic Division team names (for filtering)
const ATLANTIC_TEAMS = new Set(Object.values(TEAM_NAME_MAP));

/**
 * Fetch standings from NHL API
 */
const fetchNHLStandings = async (retryCount = 0) => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  try {
    const response = await axios.get(`${NHL_API_BASE}/standings`, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.data && response.data.records) {
      return response.data;
    }

    throw new Error('Invalid API response format');
  } catch (error) {
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`NHL API request failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchNHLStandings(retryCount + 1);
    }
    throw error;
  }
};

/**
 * Parse and filter Atlantic Division standings from NHL API response
 */
const parseAtlanticDivision = (apiData) => {
  if (!apiData || !apiData.records) {
    throw new Error('Invalid API response: missing records');
  }

  const atlanticStandings = [];

  // NHL API structure: records array contains divisions
  // Each record has teamRecords array
  for (const record of apiData.records) {
    if (!record.teamRecords) continue;

    for (const teamRecord of record.teamRecords) {
      const teamName = teamRecord.team?.name;
      
      // Check if this is an Atlantic Division team
      if (teamName && ATLANTIC_TEAMS.has(teamName)) {
        const stats = teamRecord.leagueRecord || {};
        const standings = teamRecord.standings || {};
        
        atlanticStandings.push({
          team: TEAM_NAME_MAP[teamName] || teamName,
          gp: standings.gamesPlayed || stats.wins + stats.losses + stats.ot || 0,
          w: stats.wins || 0,
          l: stats.losses || 0,
          otl: stats.ot || 0,
          pts: standings.points || teamRecord.points || 0,
        });
      }
    }
  }

  if (atlanticStandings.length !== 8) {
    console.warn(`Expected 8 Atlantic teams, found ${atlanticStandings.length}`);
  }

  return atlanticStandings;
};

/**
 * Update standings in the database
 */
const updateStandingsInDB = async (standings) => {
  if (!standings || standings.length === 0) {
    throw new Error('No standings data to update');
  }

  const now = new Date().toISOString();
  const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

  try {
    for (const standing of standings) {
      if (usePostgres) {
        // PostgreSQL UPSERT - use team name as unique identifier
        // First check if team exists, then update or insert
        const existing = await dbQuery.get(
          'SELECT team FROM standings WHERE team = $1',
          [standing.team]
        );
        
        if (existing) {
          // Update existing record
          await dbQuery.run(
            `UPDATE standings 
             SET gp = $1, w = $2, l = $3, otl = $4, pts = $5, last_updated = $6
             WHERE team = $7`,
            [standing.gp, standing.w, standing.l, standing.otl, standing.pts, now, standing.team]
          );
        } else {
          // Insert new record
          await dbQuery.run(
            `INSERT INTO standings (team, gp, w, l, otl, pts, last_updated)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [standing.team, standing.gp, standing.w, standing.l, standing.otl, standing.pts, now]
          );
        }
      } else {
        // SQLite UPSERT - delete old and insert new (since team isn't primary key)
        await dbQuery.run(
          `DELETE FROM standings WHERE team = ?`,
          [standing.team]
        );
        await dbQuery.run(
          `INSERT INTO standings (team, gp, w, l, otl, pts, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [standing.team, standing.gp, standing.w, standing.l, standing.otl, standing.pts, now]
        );
      }
    }

    console.log(`✅ Successfully updated ${standings.length} team standings`);
    return { success: true, updated: standings.length };
  } catch (error) {
    console.error('❌ Error updating standings in database:', error);
    throw error;
  }
};

/**
 * Main function to fetch and update standings
 */
export const updateStandings = async () => {
  const startTime = Date.now();
  console.log('🔄 Starting automatic standings update...');

  try {
    // Fetch from NHL API
    console.log('📡 Fetching standings from NHL API...');
    const apiData = await fetchNHLStandings();

    // Parse Atlantic Division data
    console.log('📊 Parsing Atlantic Division standings...');
    const atlanticStandings = parseAtlanticDivision(apiData);

    if (atlanticStandings.length === 0) {
      throw new Error('No Atlantic Division teams found in API response');
    }

    // Update database
    console.log('💾 Updating database...');
    const result = await updateStandingsInDB(atlanticStandings);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Standings update completed successfully in ${duration}s`);
    console.log(`   Updated ${result.updated} teams`);

    return {
      success: true,
      updated: result.updated,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Standings update failed after ${duration}s:`, error.message);
    
    return {
      success: false,
      error: error.message,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    };
  }
};


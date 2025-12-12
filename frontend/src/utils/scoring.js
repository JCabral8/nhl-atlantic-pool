/**
 * Calculate score based on accuracy-based ranking rewards
 * - Exact position match: 3 points
 * - Off-by-one: 1 point
 * - Off by 2+: 0 points
 * 
 * @param {Array} predictions - Array of predictions with {rank, team} where team is team ID
 * @param {Array} actualStandings - Array of team names in order (1st to 8th)
 * @param {Function} getTeamName - Function to convert team ID to team name
 */
export const calculateScore = (predictions, actualStandings, getTeamName = null) => {
  let totalScore = 0;
  const breakdown = [];
  
  predictions.forEach(prediction => {
    const predictedRank = prediction.rank;
    // prediction.team is a team ID (e.g., 'TB'), but actualStandings contains team names
    // Convert team ID to team name if getTeamName function is provided
    const teamIdentifier = getTeamName ? getTeamName(prediction.team) : prediction.team;
    const actualRank = actualStandings.findIndex(team => team === teamIdentifier) + 1;
    
    let points = 0;
    let status = '';
    
    if (actualRank === predictedRank) {
      points = 3;
      status = 'exact';
    } else if (Math.abs(actualRank - predictedRank) === 1) {
      points = 1;
      status = 'off-by-one';
    } else {
      points = 0;
      status = 'off-by-two-or-more';
    }
    
    totalScore += points;
    breakdown.push({
      team: prediction.team,
      predictedRank,
      actualRank: actualRank || 0, // 0 if team not found in standings
      points,
      status,
    });
  });
  
  return {
    totalScore,
    breakdown,
    maxPossible: 24,
  };
};


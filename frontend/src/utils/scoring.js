/**
 * Calculate score based on accuracy-based ranking rewards
 * - Exact position match: 3 points
 * - Off-by-one: 1 point
 * - Off by 2+: 0 points
 */
export const calculateScore = (predictions, actualStandings) => {
  let totalScore = 0;
  const breakdown = [];
  
  predictions.forEach(prediction => {
    const predictedRank = prediction.rank;
    const actualRank = actualStandings.findIndex(team => team === prediction.team) + 1;
    
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
      actualRank,
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


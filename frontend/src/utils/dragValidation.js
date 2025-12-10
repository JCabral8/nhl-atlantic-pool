export const isTeamAlreadyPlaced = (predictions, teamId) => {
  return predictions.some(p => p.team === teamId);
};

export const isSlotEmpty = (predictions, rank) => {
  return !predictions.find(p => p.rank === rank);
};

export const areAllSlotsFilled = (predictions) => {
  return predictions.length === 8;
};

export const getAvailableTeams = (allTeams, predictions) => {
  const placedTeams = predictions.map(p => p.team);
  return allTeams.filter(team => !placedTeams.includes(team.id));
};


import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useDeadline } from '../hooks/useDeadline';
import { calculateScore } from '../utils/scoring';
import { atlanticTeams } from '../data/teams';
import Avatar from './Avatar';
import TeamLogo from './TeamLogo';
import Header from './Header';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 15s ease infinite',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const ResultsPaper = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const PositionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: '12px',
  marginBottom: theme.spacing(2),
  background: 'rgba(0, 0, 0, 0.02)',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  '& > *:nth-of-type(2)': {
    flex: '1 1 0',
    minWidth: 0,
  },
}));

const UserPredictionPill = styled(Box)(({ theme, borderColor }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  borderRadius: '8px',
  background: 'white',
  border: `2px solid ${borderColor}`,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  height: '48px',
  minHeight: '48px',
}));

const PodiumContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  position: 'relative',
}));

const PodiumPlace = styled(Box)(({ theme, height, position }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '200px',
  position: 'relative',
  justifyContent: 'flex-end',
  ...(position === 'first' && {
    order: 2,
  }),
  ...(position === 'second' && {
    order: 1,
  }),
  ...(position === 'third' && {
    order: 3,
  }),
}));

const PodiumBase = styled(Box)(({ theme, position, height }) => ({
  width: '100%',
  height: `${height}px`,
  borderRadius: '12px 12px 0 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingTop: theme.spacing(2),
  position: 'relative',
  flexShrink: 0,
  ...(position === 'first' && {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
  }),
  ...(position === 'second' && {
    background: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)',
    boxShadow: '0 8px 24px rgba(192, 192, 192, 0.4)',
  }),
  ...(position === 'third' && {
    background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
    boxShadow: '0 8px 24px rgba(205, 127, 50, 0.4)',
  }),
}));

const ResultsPage = () => {
  const { API_BASE, standings, users } = useApp();
  const { isActive } = useDeadline();
  const [allPredictions, setAllPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllPredictions();
  }, []);

  // Get team data helper - accepts either team ID or team name
  // Must be defined before useMemo that uses it
  const getTeamData = (teamIdentifier) => {
    if (!teamIdentifier) return null;
    // First try to find by ID (e.g., 'TB', 'BOS')
    let team = atlanticTeams.find(t => t.id === teamIdentifier);
    // If not found, try by name (e.g., 'Tampa Bay Lightning')
    if (!team) {
      team = atlanticTeams.find(t => t.name === teamIdentifier);
    }
    return team || null;
  };

  const fetchAllPredictions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/predictions/all`);
      console.log('Fetched predictions:', response.data);
      setAllPredictions(response.data || []);
    } catch (error) {
      console.error('Error fetching all predictions:', error);
      setAllPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate scores for all users
  const userScores = useMemo(() => {
    if (!users || users.length === 0) return [];
    
    // If no standings, return users with 0 scores
    if (!standings || standings.length === 0) {
      return users.map(user => {
        let avatarPrefs = null;
        if (user.avatar_preferences) {
          try {
            avatarPrefs = typeof user.avatar_preferences === 'string' 
              ? JSON.parse(user.avatar_preferences) 
              : user.avatar_preferences;
          } catch (e) {
            console.error('Error parsing avatar preferences:', e);
          }
        }
        return {
          userId: user.id,
          userName: user.name,
          avatarPreferences: avatarPrefs,
          predictions: [],
          score: 0,
          breakdown: [],
        };
      });
    }
    
    const teamNames = standings.map(s => s.team);
    
    // Helper to convert team ID to team name
    const getTeamNameFromId = (teamId) => {
      const team = getTeamData(teamId);
      return team?.name || teamId;
    };
    
    // Create a map of userId to prediction data
    const predictionsMap = new Map();
    allPredictions.forEach(pred => {
      const score = calculateScore(pred.predictions, teamNames, getTeamNameFromId);
      predictionsMap.set(pred.userId, {
        ...pred,
        score: score.totalScore,
        breakdown: score.breakdown,
      });
    });
    
    // Include all users, even if they don't have predictions
    return users.map(user => {
      const predictionData = predictionsMap.get(user.id);
      if (predictionData) {
        return predictionData;
      }
      // User has no predictions - give them 0 points
      let avatarPrefs = null;
      if (user.avatar_preferences) {
        try {
          avatarPrefs = typeof user.avatar_preferences === 'string' 
            ? JSON.parse(user.avatar_preferences) 
            : user.avatar_preferences;
        } catch (e) {
          console.error('Error parsing avatar preferences:', e);
        }
      }
      return {
        userId: user.id,
        userName: user.name,
        avatarPreferences: avatarPrefs,
        predictions: [],
        score: 0,
        breakdown: [],
      };
    }).sort((a, b) => b.score - a.score);
  }, [standings, allPredictions, users]);

  // Get team color helper
  const getTeamColor = (teamName) => {
    const team = getTeamData(teamName);
    return team?.primaryColor || '#2C3E50';
  };

  // Get user's prediction for a specific rank
  const getUserPredictionForRank = (userId, rank) => {
    const userPred = allPredictions.find(p => p.userId === userId);
    if (!userPred) return null;
    return userPred.predictions.find(p => p.rank === rank);
  };

  // Get avatar border color based on prediction accuracy
  const getAvatarBorderColor = (predictedRank, actualRank) => {
    if (predictedRank === actualRank) return '#10b981'; // Green
    if (Math.abs(predictedRank - actualRank) === 1) return '#fbbf24'; // Yellow
    return '#ef4444'; // Red
  };

  // Debug logging
  useEffect(() => {
    console.log('ResultsPage state:', {
      loading,
      standings: standings?.length || 0,
      users: users?.length || 0,
      allPredictions: allPredictions.length,
      userScores: userScores.length,
    });
  }, [loading, standings, users, allPredictions, userScores]);

  if (loading) {
    return (
      <StyledContainer>
        <Header />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress size={48} />
        </Box>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer maxWidth={false}>
      <Header />
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Page Title */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h2"
            component="h1"
            fontWeight="700"
            color="white"
            mb={2}
            sx={{
              fontFamily: 'Segoe UI, sans-serif',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            🏆 Results
          </Typography>
          <Typography
            variant="h6"
            color="rgba(255, 255, 255, 0.9)"
            sx={{ fontFamily: 'Segoe UI, sans-serif' }}
          >
            Live Atlantic Division Standings & Predictions
          </Typography>
        </Box>

        {/* Standings with Predictions */}
        {standings && standings.length > 0 ? (
          <ResultsPaper>
            <Typography
              variant="h4"
              fontWeight="700"
              mb={3}
              sx={{ fontFamily: 'Segoe UI, sans-serif' }}
            >
              Standings & Predictions
            </Typography>
            
            {standings.map((standing, index) => {
            const actualRank = index + 1;
            const teamData = getTeamData(standing.team);
            const teamColor = getTeamColor(standing.team);
            
            return (
              <PositionRow key={standing.team}>
                {/* Position Number */}
                <Box
                  sx={{
                    minWidth: 60,
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    color: 'text.primary',
                    fontFamily: 'Segoe UI, sans-serif',
                  }}
                >
                  {actualRank}
                </Box>

                {/* Actual Team Pill */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    height: 48,
                    minHeight: 48,
                    minWidth: 250,
                    flex: '1 1 auto',
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}dd 100%)`,
                    border: `2px solid ${teamColor}`,
                    boxShadow: `0 4px 12px ${teamColor}40`,
                  }}
                >
                  <TeamLogo teamData={teamData} size="32px" />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      fontFamily: 'Segoe UI, sans-serif',
                      mr: 1,
                    }}
                  >
                    {standing.team}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      ml: 'auto',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      fontFamily: 'Segoe UI, sans-serif',
                    }}
                  >
                    <Typography component="span" sx={{ fontSize: '0.75rem' }}>
                      {standing.w}-{standing.l}-{standing.otl}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 700, ml: 0.5 }}>
                      {standing.pts} PTS
                    </Typography>
                  </Box>
                </Box>

                {/* User Predictions */}
                <Box sx={{ display: 'flex', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
                  {allPredictions.map((userPred) => {
                    const prediction = getUserPredictionForRank(userPred.userId, actualRank);
                    if (!prediction) return null;
                    
                    // Find team data - prediction.team is the team ID (e.g., 'TB', 'BOS')
                    const predTeamData = getTeamData(prediction.team);
                    // Get team name for standings lookup (standings use full team names)
                    const teamNameForStandings = predTeamData?.name || prediction.teamName || prediction.team;
                    const actualTeamRank = standings.findIndex(s => s.team === teamNameForStandings) + 1;
                    const borderColor = getAvatarBorderColor(prediction.rank, actualTeamRank);
                    
                    return (
                      <UserPredictionPill key={userPred.userId} borderColor={borderColor}>
                        <Avatar
                          userId={userPred.userId}
                          name={userPred.userName}
                          size={32}
                          preferences={userPred.avatarPreferences}
                        />
                        {predTeamData ? (
                          <TeamLogo teamData={predTeamData} size="32px" />
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'Segoe UI, sans-serif',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              color: 'text.secondary',
                              textAlign: 'center',
                              minWidth: 32,
                            }}
                          >
                            {prediction.team.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase()}
                          </Typography>
                        )}
                      </UserPredictionPill>
                    );
                  })}
                </Box>
              </PositionRow>
            );
          })}
        </ResultsPaper>
        ) : (
          <ResultsPaper>
            <Typography
              variant="h6"
              color="text.secondary"
              textAlign="center"
              sx={{ fontFamily: 'Segoe UI, sans-serif', py: 4 }}
            >
              Standings data is not available yet. Please check back later.
            </Typography>
          </ResultsPaper>
        )}

        {/* Podium Section */}
        {userScores.length > 0 && (
          <ResultsPaper>
            <Typography
              variant="h4"
              fontWeight="700"
              mb={3}
              textAlign="center"
              sx={{ fontFamily: 'Segoe UI, sans-serif' }}
            >
              🏁 Leaderboard
            </Typography>

            <PodiumContainer>
              {/* 2nd Place */}
              {userScores.length > 1 && userScores[1] && (
                <PodiumPlace position="second">
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography
                      variant="h3"
                      fontWeight="700"
                      mb={2}
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      {userScores[1].score} pts
                    </Typography>
                    <Box display="flex" justifyContent="center">
                      <Avatar
                        userId={userScores[1].userId}
                        name={userScores[1].userName}
                        size={120}
                        preferences={userScores[1].avatarPreferences}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      mt={2}
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      {userScores[1].userName}
                    </Typography>
                  </Box>
                  <PodiumBase height={200} position="second">
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      {userScores[1].breakdown
                        .filter(b => b.points > 0)
                        .map((item, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            display="block"
                            sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}
                          >
                            {item.points} pts from {item.team} in {item.predictedRank}{item.predictedRank === 1 ? 'st' : item.predictedRank === 2 ? 'nd' : item.predictedRank === 3 ? 'rd' : 'th'} place
                          </Typography>
                        ))}
                    </Box>
                  </PodiumBase>
                </PodiumPlace>
              )}

              {/* 1st Place */}
              {userScores[0] && (
                <PodiumPlace position="first">
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography
                      variant="h2"
                      fontWeight="700"
                      mb={2}
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      {userScores[0].score} pts
                    </Typography>
                    <Box display="flex" justifyContent="center">
                      <Avatar
                        userId={userScores[0].userId}
                        name={userScores[0].userName}
                        size={140}
                        preferences={userScores[0].avatarPreferences}
                      />
                    </Box>
                    <Typography
                      variant="h5"
                      fontWeight="600"
                      mt={2}
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      {userScores[0].userName}
                    </Typography>
                  </Box>
                  <PodiumBase height={240} position="first">
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      {userScores[0].breakdown
                        .filter(b => b.points > 0)
                        .map((item, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            display="block"
                            sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}
                          >
                            {item.points} pts from {item.team} in {item.predictedRank}{item.predictedRank === 1 ? 'st' : item.predictedRank === 2 ? 'nd' : item.predictedRank === 3 ? 'rd' : 'th'} place
                          </Typography>
                        ))}
                    </Box>
                  </PodiumBase>
                </PodiumPlace>
              )}

              {/* 3rd Place */}
              {userScores.length > 2 && (
                <PodiumPlace position="third">
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      fontWeight="700"
                      mb={2}
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      {userScores[2].score} pts
                    </Typography>
                    <Box display="flex" justifyContent="center">
                      <Avatar
                        userId={userScores[2].userId}
                        name={userScores[2].userName}
                        size={100}
                        preferences={userScores[2].avatarPreferences}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight="600"
                      mt={2}
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      {userScores[2].userName}
                    </Typography>
                  </Box>
                  <PodiumBase height={160} position="third">
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      {userScores[2].breakdown
                        .filter(b => b.points > 0)
                        .map((item, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            display="block"
                            sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}
                          >
                            {item.points} pts from {item.team} in {item.predictedRank}{item.predictedRank === 1 ? 'st' : item.predictedRank === 2 ? 'nd' : item.predictedRank === 3 ? 'rd' : 'th'} place
                          </Typography>
                        ))}
                      {userScores[2].breakdown.filter(b => b.points > 0).length === 0 && (
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: 'Segoe UI, sans-serif', color: 'text.secondary' }}
                        >
                          No points yet
                        </Typography>
                      )}
                    </Box>
                  </PodiumBase>
                </PodiumPlace>
              )}
            </PodiumContainer>
          </ResultsPaper>
        )}
      </Container>
    </StyledContainer>
  );
};

export default ResultsPage;


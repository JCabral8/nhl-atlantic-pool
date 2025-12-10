import { useMemo, useCallback, memo } from 'react';
import { useApp } from '../context/AppContext';
import { atlanticTeams } from '../data/teams';
import TeamLogo from './TeamLogo';
import { Paper, Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  height: '100%',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
}));

const TeamPill = styled(Paper, {
  shouldForwardProp: (prop) => !['teamGradient', 'teamColor', 'isPlaced', 'isSelected'].includes(prop),
})(({ theme, teamGradient, teamColor, isPlaced, isSelected }) => ({
  background: isPlaced 
    ? 'rgba(0, 0, 0, 0.05)' 
    : (teamGradient || `linear-gradient(135deg, ${teamColor} 0%, ${teamColor} 100%)`),
  border: `2px solid ${isSelected ? theme.palette.primary.main : (isPlaced ? 'rgba(0, 0, 0, 0.1)' : `${teamColor}66`)}`,
  borderRadius: '12px',
  padding: theme.spacing(2),
  cursor: isPlaced ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  opacity: isPlaced ? 0.5 : 1,
  boxShadow: isSelected ? `0 0 0 3px ${theme.palette.primary.main}40` : 'none',
  '&:hover': {
    transform: isPlaced ? 'none' : 'scale(1.02)',
    boxShadow: isPlaced ? 'none' : '0 8px 24px rgba(0, 0, 0, 0.2)',
    '& .drag-indicator': {
      opacity: isPlaced ? 0 : 1,
    },
  },
  '&:active': {
    cursor: isPlaced ? 'not-allowed' : 'pointer',
  },
}));

const TeamPillsTable = memo(({ predictions = [], selectedTeam, onTeamSelect }) => {
  const { standings } = useApp();

  const getTeamData = useCallback((teamName) => {
    return atlanticTeams.find(t => t.name === teamName);
  }, []);

  const sortedStandings = useMemo(() => {
    return [...standings].sort((a, b) => b.pts - a.pts);
  }, [standings]);

  const placedTeamIds = useMemo(() => {
    return new Set(predictions.map(p => p.team));
  }, [predictions]);

  const isTeamPlaced = useCallback((teamId) => {
    return placedTeamIds.has(teamId);
  }, [placedTeamIds]);

  return (
    <StyledPaper>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          flexShrink: 0,
        }}
      >
        <Typography
          variant="h5"
          fontWeight="700"
          sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}
        >
          Current Standings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
          Tap or drag teams to your predictions
        </Typography>
      </Box>

      {/* Team Pills List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {sortedStandings.map((standing, index) => {
          const teamData = getTeamData(standing.team);
          if (!teamData) return null;

          const rank = index + 1;
          const isPlaced = isTeamPlaced(teamData.id);
          const isSelected = selectedTeam?.id === teamData.id;

          const handleClick = () => {
            if (!isPlaced && onTeamSelect) {
              onTeamSelect(isSelected ? null : { id: teamData.id, name: teamData.name });
            }
          };

          return (
            <TeamPill
              key={standing.team}
              teamGradient={teamData.gradient}
              teamColor={teamData.primaryColor}
              isPlaced={isPlaced}
              isSelected={isSelected}
              draggable={!isPlaced}
              onClick={handleClick}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', '');
                e.dataTransfer.setData('teamId', teamData.id);
                e.dataTransfer.setData('teamName', teamData.name);
                e.dataTransfer.setData('source', 'standings');
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.cursor = 'grabbing';
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.cursor = 'pointer';
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Rank Badge */}
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 700,
                    fontFamily: 'Segoe UI, sans-serif',
                  }}
                >
                  {rank}
                </Avatar>

                {/* Team Logo */}
                <Box sx={{ flexShrink: 0 }}>
                  <TeamLogo teamData={teamData} size="56px" />
                </Box>

                {/* Team Name */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    sx={{
                      fontFamily: 'Segoe UI, sans-serif',
                      color: isPlaced ? 'text.secondary' : 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {teamData.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ 
                        fontFamily: 'Segoe UI, sans-serif', 
                        color: isPlaced ? 'text.secondary' : 'rgba(255, 255, 255, 0.9)', 
                        fontWeight: 500 
                      }}
                    >
                      {standing.pts} PTS
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ 
                        fontFamily: 'Segoe UI, sans-serif', 
                        color: isPlaced ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' 
                      }}
                    >
                      {standing.w}-{standing.l}-{standing.otl}
                    </Typography>
                  </Box>
                </Box>

                {/* Drag Indicator */}
                <Box
                  className="drag-indicator"
                  sx={{
                    flexShrink: 0,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </Box>
              </Box>
            </TeamPill>
          );
        })}
      </Box>
    </StyledPaper>
  );
});

TeamPillsTable.displayName = 'TeamPillsTable';

export default TeamPillsTable;

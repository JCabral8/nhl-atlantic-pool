import { useState, useCallback, useMemo } from 'react';
import { atlanticTeams } from '../data/teams';
import TeamLogo from './TeamLogo';
import { Paper, Box, Typography, IconButton, Avatar, Menu, MenuItem, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const StyledSlot = styled(Paper, {
  shouldForwardProp: (prop) => !['isDragOver', 'isEmpty', 'teamGradient', 'teamColor'].includes(prop),
})(({ theme, isDragOver, isEmpty, teamGradient, teamColor }) => ({
  position: 'relative',
  borderRadius: '12px',
  padding: theme.spacing(2),
  border: '2px solid',
  transition: 'all 0.2s ease',
  ...(isEmpty
    ? {
        borderStyle: 'dashed',
        borderColor: isDragOver ? theme.palette.primary.main : theme.palette.grey[400],
        background: isDragOver ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.02)',
        transform: isDragOver ? 'scale(1.05)' : 'scale(1)',
      }
    : {
        borderStyle: 'solid',
        borderColor: isDragOver ? theme.palette.primary.main : `${teamColor}80`,
        background: teamGradient || `linear-gradient(135deg, ${teamColor} 0%, ${teamColor} 100%)`,
        boxShadow: `0 4px 12px ${teamColor}40`,
      }),
}));

const PredictionSlots = ({ predictions, onPredictionsChange, disabled, selectedTeam, onTeamSelect }) => {
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuSlot, setMenuSlot] = useState(null);

  const handleDragOver = useCallback((e, rank) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(rank);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSlot(null);
    }
  }, []);

  const handleDrop = useCallback((e, rank) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    setDraggedSlot(null);

    const teamId = e.dataTransfer.getData('teamId');
    const teamName = e.dataTransfer.getData('teamName');
    const source = e.dataTransfer.getData('source');

    if (!teamId) {
      return;
    }

    // Handle reordering from another slot
    if (source === 'slot') {
      const existingPrediction = predictions.find(p => p.team === teamId);
      if (existingPrediction) {
        const newPredictions = predictions.filter(p => p.team !== teamId);
        const targetSlot = newPredictions.find(p => p.rank === rank);
        if (targetSlot) {
          const oldRank = existingPrediction.rank;
          newPredictions.push({ rank: oldRank, team: targetSlot.team, teamName: targetSlot.teamName });
        }
        newPredictions.push({ rank, team: teamId, teamName });
        onPredictionsChange(newPredictions);
      }
      return;
    }

    // Handle drop from standings
    if (source === 'standings') {
      const newPredictions = predictions.filter(p => p.team !== teamId && p.rank !== rank);
      newPredictions.push({ rank, team: teamId, teamName });
      onPredictionsChange(newPredictions);
      return;
    }
  }, [disabled, predictions, onPredictionsChange]);

  const getTeamData = useCallback((teamId) => {
    return atlanticTeams.find(t => t.id === teamId);
  }, []);

  const handleRemove = useCallback((teamId) => {
    if (disabled) return;
    const newPredictions = predictions.filter(p => p.team !== teamId);
    onPredictionsChange(newPredictions);
    setMenuAnchor(null);
    setMenuSlot(null);
    if (onTeamSelect) onTeamSelect(null);
  }, [disabled, predictions, onPredictionsChange, onTeamSelect]);

  const handleMenuOpen = useCallback((e, rank) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuSlot(rank);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuSlot(null);
  }, []);

  const handleMoveToSlot = useCallback((targetRank) => {
    if (!menuSlot) return;
    const sourcePrediction = predictions.find(p => p.rank === menuSlot);
    if (!sourcePrediction) return;
    
    const newPredictions = predictions.filter(p => p.team !== sourcePrediction.team);
    const targetPrediction = newPredictions.find(p => p.rank === targetRank);
    if (targetPrediction) {
      newPredictions.push({ rank: menuSlot, team: targetPrediction.team, teamName: targetPrediction.teamName });
    }
    newPredictions.push({ rank: targetRank, team: sourcePrediction.team, teamName: sourcePrediction.teamName });
    onPredictionsChange(newPredictions);
    handleMenuClose();
    if (onTeamSelect) onTeamSelect(null);
  }, [menuSlot, predictions, onPredictionsChange, handleMenuClose, onTeamSelect]);

  const handleSlotClick = useCallback((rank, prediction) => {
    if (disabled) return;
    
    // If there's a selected team from standings, place it in empty slot
    if (selectedTeam && !prediction) {
      const newPredictions = predictions.filter(p => p.team !== selectedTeam.id && p.rank !== rank);
      newPredictions.push({ rank, team: selectedTeam.id, teamName: selectedTeam.name });
      onPredictionsChange(newPredictions);
      if (onTeamSelect) onTeamSelect(null);
      return;
    }
    
    // If clicking a slot with a team and we have a selected team from predictions, swap/move
    if (selectedTeam && prediction && selectedTeam.id !== prediction.team) {
      const newPredictions = predictions.filter(p => p.team !== selectedTeam.id && p.team !== prediction.team);
      const sourcePrediction = predictions.find(p => p.team === selectedTeam.id);
      if (sourcePrediction) {
        // Swap positions
        newPredictions.push({ rank: sourcePrediction.rank, team: prediction.team, teamName: prediction.teamName });
      }
      newPredictions.push({ rank, team: selectedTeam.id, teamName: selectedTeam.name });
      onPredictionsChange(newPredictions);
      if (onTeamSelect) onTeamSelect(null);
      return;
    }
    
    // If slot has a team and no team is selected, select it for moving
    if (prediction && !selectedTeam) {
      if (onTeamSelect) {
        const teamData = getTeamData(prediction.team);
        onTeamSelect({ id: prediction.team, name: teamData?.name || prediction.teamName });
      }
    }
    
    // If clicking the same selected team, deselect it
    if (prediction && selectedTeam && selectedTeam.id === prediction.team) {
      if (onTeamSelect) onTeamSelect(null);
    }
  }, [disabled, selectedTeam, predictions, onPredictionsChange, onTeamSelect, getTeamData]);

  const handleSlotDragStart = useCallback((e, prediction) => {
    if (disabled) return;
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('teamId', prediction.team);
    e.dataTransfer.setData('teamName', prediction.teamName);
    e.dataTransfer.setData('source', 'slot');
    setDraggedSlot(prediction.rank);
    e.currentTarget.style.opacity = '0.5';
  }, [disabled]);

  const handleSlotDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedSlot(null);
  }, []);

  const renderSlot = (rank) => {
    const prediction = predictions.find(p => p.rank === rank);
    const isDragOver = dragOverSlot === rank;
    const isEmpty = !prediction;
    const isDragged = draggedSlot === rank;
    const teamData = prediction ? getTeamData(prediction.team) : null;
    const isSelected = selectedTeam && (isEmpty || (prediction && selectedTeam.id === prediction.team));
    const showMenu = menuSlot === rank;

    return (
      <StyledSlot
        key={rank}
        isDragOver={isDragOver || isSelected}
        isEmpty={isEmpty}
        teamGradient={teamData?.gradient}
        teamColor={teamData?.primaryColor}
        onClick={() => handleSlotClick(rank, prediction)}
        onDragOver={(e) => handleDragOver(e, rank)}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setDragOverSlot(rank);
        }}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, rank)}
        sx={{
          opacity: isDragged ? 0.5 : disabled ? 0.6 : 1,
          cursor: !disabled ? 'pointer' : 'default',
          '&:hover': !disabled && { transform: 'scale(1.01)' },
          border: isSelected ? `3px solid ${teamData?.primaryColor || 'primary.main'}` : undefined,
        }}
      >
        {/* Rank Badge */}
        <Avatar
          sx={{
            position: 'absolute',
            left: -12,
            top: -12,
            width: 40,
            height: 40,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            fontWeight: 700,
            fontFamily: 'Segoe UI, sans-serif',
            zIndex: 10,
          }}
        >
          {rank}
        </Avatar>

        {/* Slot Content */}
        <Box sx={{ pl: 2 }}>
          {prediction && teamData ? (
            <Box
              draggable={!disabled}
              onDragStart={(e) => handleSlotDragStart(e, prediction)}
              onDragEnd={handleSlotDragEnd}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: disabled ? 'default' : 'grab',
                '&:active': { cursor: 'grabbing' },
              }}
            >
              {/* Team Logo */}
              <Box sx={{ flexShrink: 0 }}>
                <TeamLogo teamData={teamData} size="56px" />
              </Box>

              {/* Team Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  fontWeight="700"
                  sx={{
                    fontFamily: 'Segoe UI, sans-serif',
                    color: 'white',
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {teamData.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'Segoe UI, sans-serif', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}
                >
                  {teamData.abbreviation}
                </Typography>
              </Box>

              {/* Action Menu Button */}
              {!disabled && (
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, rank)}
                  sx={{
                    bgcolor: 'rgba(0, 0, 0, 0.1)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.2)' },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 64 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    mb: 0.5,
                    transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.15s',
                  }}
                >
                  {isDragOver ? '⬇️' : '🏒'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'Segoe UI, sans-serif',
                    color: isDragOver ? 'primary.main' : 'text.secondary',
                    fontWeight: 500,
                    transition: 'color 0.15s',
                  }}
                >
                  {disabled ? 'No prediction' : isDragOver ? 'Drop here!' : 'Drag team here'}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </StyledSlot>
    );
  };

  const slots = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8], []);
  const menuPrediction = menuSlot ? predictions.find(p => p.rank === menuSlot) : null;

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {slots.map(rank => renderSlot(rank))}
      </Box>
      
      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuPrediction) handleRemove(menuPrediction.team);
          }}
          sx={{ fontFamily: 'Segoe UI, sans-serif' }}
        >
          <CloseIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          Remove
        </MenuItem>
        <MenuItem
          onClick={handleMenuClose}
          sx={{ fontFamily: 'Segoe UI, sans-serif', fontSize: '0.875rem', color: 'text.secondary' }}
        >
          Tap another slot to move here
        </MenuItem>
      </Menu>
    </>
  );
};

export default PredictionSlots;

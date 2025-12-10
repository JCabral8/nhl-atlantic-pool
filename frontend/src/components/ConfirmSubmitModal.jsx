import { atlanticTeams } from '../data/teams';
import TeamLogo from './TeamLogo';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  Avatar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    maxWidth: '600px',
    width: '100%',
  },
}));

const PredictionCard = styled(Paper)(({ theme, teamGradient }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  background: teamGradient ? `${teamGradient}20` : 'rgba(0, 0, 0, 0.02)',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  transition: 'all 0.2s',
  '&:hover': {
    background: teamGradient ? `${teamGradient}30` : 'rgba(0, 0, 0, 0.05)',
    transform: 'translateY(-2px)',
    boxShadow: 2,
  },
}));

const ConfirmSubmitModal = ({ isOpen, onClose, onConfirm, predictions }) => {
  const getTeamName = (teamId) => {
    return atlanticTeams.find(t => t.id === teamId)?.name || teamId;
  };

  const getTeamData = (teamId) => {
    return atlanticTeams.find(t => t.id === teamId);
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <StyledDialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="h2" sx={{ mb: 2, fontFamily: 'Segoe UI, sans-serif' }}>
          🏒
        </Typography>
        <Typography
          variant="h4"
          fontWeight="700"
          sx={{
            fontFamily: 'Segoe UI, sans-serif',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Confirm Your Predictions
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
          Review your picks before locking them in
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Paper
          sx={{
            p: 3,
            mb: 3,
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h5">📋</Typography>
            <Typography variant="h6" fontWeight="700" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
              Your Final Standings Prediction
            </Typography>
          </Box>
          <Box>
            {predictions
              .sort((a, b) => a.rank - b.rank)
              .map((pred) => {
                const teamData = getTeamData(pred.team);
                const medal = getMedalEmoji(pred.rank);
                return (
                  <PredictionCard key={pred.rank} teamGradient={teamData?.gradient}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 60 }}>
                      {medal && <Typography variant="h5">{medal}</Typography>}
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          fontWeight: 700,
                          fontFamily: 'Segoe UI, sans-serif',
                        }}
                      >
                        {pred.rank}
                      </Avatar>
                    </Box>
                    <Box sx={{ flexShrink: 0 }}>
                      <TeamLogo teamData={teamData} size="56px" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ mb: 1 }}>
                        <Chip
                          label={teamData?.abbreviation}
                          size="small"
                          sx={{
                            background: teamData?.gradient || 'rgba(0, 0, 0, 0.1)',
                            color: 'white',
                            fontWeight: 600,
                            fontFamily: 'Segoe UI, sans-serif',
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        sx={{
                          fontFamily: 'Segoe UI, sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getTeamName(pred.team)}
                      </Typography>
                    </Box>
                  </PredictionCard>
                );
              })}
          </Box>
        </Paper>

        <Alert severity="info" icon="ℹ️" sx={{ borderRadius: '12px' }}>
          <Typography variant="body2" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            You can edit your predictions anytime before the deadline (Dec 13, 2025 at 11:59 PM EST)
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="large"
          fullWidth
          sx={{
            fontFamily: 'Segoe UI, sans-serif',
            fontWeight: 600,
            py: 1.5,
            borderRadius: '12px',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          size="large"
          fullWidth
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            },
            fontFamily: 'Segoe UI, sans-serif',
            fontWeight: 600,
            py: 1.5,
            borderRadius: '12px',
          }}
        >
          ✓ Confirm & Submit
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ConfirmSubmitModal;

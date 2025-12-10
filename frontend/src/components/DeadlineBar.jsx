import { useDeadline } from '../hooks/useDeadline';
import { Paper, Box, Typography, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme, urgency }) => {
  let gradient = 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)';
  if (urgency === 'closed') {
    gradient = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)';
  } else if (urgency === 'urgent') {
    gradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)';
  }

  return {
    background: gradient,
    color: 'white',
    borderRadius: '16px',
    padding: theme.spacing(3),
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    ...(urgency === 'urgent' && {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.9 },
      },
    }),
  };
});

const DeadlineBar = () => {
  const { formattedTime, isActive, timeRemaining } = useDeadline();

  const getUrgency = () => {
    if (!isActive) return 'closed';
    if (timeRemaining < 24 * 60 * 60 * 1000) return 'urgent';
    return 'normal';
  };

  const getIcon = () => {
    if (!isActive) return '🔒';
    if (timeRemaining < 24 * 60 * 60 * 1000) return '⚠️';
    return '⏰';
  };

  const urgency = getUrgency();

  return (
    <StyledPaper urgency={urgency}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255, 255, 255, 0.03) 50px, rgba(255, 255, 255, 0.03) 51px)',
          opacity: 0.2,
        }}
      />
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
            {getIcon()}
          </Typography>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography
                variant="h5"
                fontWeight="700"
                sx={{ fontFamily: 'Segoe UI, sans-serif', fontSize: { xs: '1.25rem', md: '1.5rem' } }}
              >
                {isActive ? 'Deadline Countdown' : 'Pool Closed'}
              </Typography>
              {isActive && timeRemaining < 60 * 60 * 1000 && (
                <Chip
                  label="HURRY!"
                  size="small"
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontFamily: 'Segoe UI, sans-serif',
                  }}
                />
              )}
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'Segoe UI, sans-serif',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            >
              {isActive ? formattedTime : 'Submissions are no longer accepted'}
            </Typography>
          </Box>
        </Box>
        <Paper
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            px: 3,
            py: 2,
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontFamily: 'Segoe UI, sans-serif', color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}
          >
            Final Deadline
          </Typography>
          <Typography
            variant="h6"
            fontWeight="700"
            sx={{ fontFamily: 'Segoe UI, sans-serif', mt: 0.5 }}
          >
            Dec 13, 2025
          </Typography>
          <Typography
            variant="body2"
            fontWeight="600"
            sx={{ fontFamily: 'Segoe UI, sans-serif', color: '#a5f3fc', mt: 0.5 }}
          >
            11:59 PM EST
          </Typography>
        </Paper>
      </Box>
    </StyledPaper>
  );
};

export default DeadlineBar;

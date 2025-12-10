import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Container,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

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

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)',
    border: '2px solid rgba(59, 130, 246, 0.5)',
  },
}));

const InfoPaper = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  padding: theme.spacing(4),
  border: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
}));

const HomePage = () => {
  const navigate = useNavigate();
  const { users, loading, setCurrentUser } = useApp();

  const handleUserSelect = (user) => {
    setCurrentUser(user);
    navigate(`/predict/${user.id}`);
  };

  if (loading) {
    return (
      <StyledContainer maxWidth={false} sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Paper
            sx={{
              p: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={48} />
              <Typography variant="h5" fontWeight="600" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                Loading...
              </Typography>
            </Box>
          </Paper>
        </Box>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer maxWidth={false} sx={{ py: 3 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Title Section */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h1"
            fontWeight="700"
            color="white"
            mb={2}
            sx={{
              fontFamily: 'Segoe UI, sans-serif',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            NHL Atlantic Conference
          </Typography>
          <Typography
            variant="h4"
            component="h2"
            fontWeight="500"
            color="white"
            sx={{
              fontFamily: 'Segoe UI, sans-serif',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            Final Standings Prediction Pool
          </Typography>
        </Box>

        {/* User Cards - Centered */}
        <Box display="flex" justifyContent="center" mb={6}>
          <Grid container spacing={4} sx={{ maxWidth: '1200px' }}>
            {users.map((user, index) => (
              <Grid item xs={12} sm={6} md={4} key={user.id}>
                <StyledCard onClick={() => handleUserSelect(user)}>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    {/* Avatar */}
                    <Box display="flex" justifyContent="center" mb={3}>
                      <Avatar userId={user.id} name={user.name} size={160} />
                    </Box>

                    {/* Name */}
                    <Typography
                      variant="h4"
                      component="h3"
                      fontWeight="700"
                      color="text.primary"
                      mb={1}
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      {user.name}
                    </Typography>

                    {/* Subtitle */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textTransform="uppercase"
                      letterSpacing={2}
                      fontWeight="500"
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      Click to Play
                    </Typography>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Info Section */}
        <InfoPaper>
          <Box textAlign="center">
            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
              <Typography variant="h4">⏰</Typography>
              <Typography
                variant="h6"
                fontWeight="600"
                color="text.primary"
                sx={{ fontFamily: 'Segoe UI, sans-serif' }}
              >
                Deadline:{' '}
                <Box component="span" color="primary.main" fontWeight="700">
                  Friday, December 13, 2025
                </Box>{' '}
                at{' '}
                <Box component="span" color="primary.main" fontWeight="700">
                  11:59 PM EST
                </Box>
              </Typography>
            </Box>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontFamily: 'Segoe UI, sans-serif' }}
            >
              Predict the final standings and claim victory!
            </Typography>
          </Box>
        </InfoPaper>
      </Container>
    </StyledContainer>
  );
};

export default HomePage;

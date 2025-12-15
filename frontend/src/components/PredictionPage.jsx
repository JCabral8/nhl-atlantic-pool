import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { usePredictions } from '../hooks/usePredictions';
import { useDeadline } from '../hooks/useDeadline';
import { areAllSlotsFilled } from '../utils/dragValidation';
import Header from './Header';
import WaiverModal from './WaiverModal';
import axios from 'axios';
import TeamPillsTable from './TeamPillsTable';
import PredictionSlots from './PredictionSlots';
import DeadlineBar from './DeadlineBar';
import ConfirmSubmitModal from './ConfirmSubmitModal';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 15s ease infinite',
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const PredictionsPaper = styled(Paper)(({ theme }) => ({
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

const PredictionPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { setCurrentUser, users, API_BASE } = useApp();
  const { isActive } = useDeadline();
  const {
    predictions: savedPredictions,
    setPredictions: setSavedPredictions,
    loading,
    savePredictions,
    submittedAt,
  } = usePredictions(userId);

  const [localPredictions, setLocalPredictions] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showWaiverModal, setShowWaiverModal] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const predictorRef = useRef(null);

  // Check if user has accepted waiver
  const checkWaiverStatus = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE}/users/${userId}/waiver`);
      return response.data.waiverAccepted === true;
    } catch (error) {
      console.error('Error checking waiver status:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkAndSetUser = async () => {
      const user = users.find(u => u.id === userId);
      if (user) {
        // Check if user needs to accept waiver
        const hasAccepted = await checkWaiverStatus(userId);
        if (!hasAccepted) {
          setShowWaiverModal(true);
        } else {
          setCurrentUser(user);
        }
      }
    };
    
    if (users.length > 0) {
      checkAndSetUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, users]);

  const handleWaiverAccept = async () => {
    try {
      // Save waiver acceptance to database
      const response = await axios.put(`${API_BASE}/users/${userId}/waiver`);
      
      if (response.data.success) {
        // Set current user and close modal
        const user = users.find(u => u.id === userId);
        if (user) {
          setCurrentUser(user);
        }
        setShowWaiverModal(false);
      } else {
        throw new Error(response.data.error || 'Failed to save waiver');
      }
    } catch (error) {
      console.error('Error accepting waiver:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
      alert(`Failed to save waiver acceptance: ${errorMessage}\n\nYou may need to run /api/migrate first.`);
    }
  };

  useEffect(() => {
    if (savedPredictions && savedPredictions.length > 0) {
      setLocalPredictions(savedPredictions);
    }
  }, [savedPredictions]);

  useEffect(() => {
    if (savedPredictions && savedPredictions.length > 0) {
      const hasChanges = JSON.stringify(localPredictions.sort((a, b) => a.rank - b.rank)) !== 
                         JSON.stringify(savedPredictions.sort((a, b) => a.rank - b.rank));
      setHasUnsavedChanges(hasChanges && localPredictions.length === 8);
    } else {
      setHasUnsavedChanges(localPredictions.length === 8);
    }
  }, [localPredictions, savedPredictions]);

  const allSlotsFilled = areAllSlotsFilled(localPredictions);

  const handleSubmit = () => {
    if (!allSlotsFilled || !isActive) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    const result = await savePredictions(localPredictions);
    
    if (result.success) {
      setShowSuccessMessage(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setShowSuccessMessage(false), 4000);
    } else {
      setErrorMessage(result.error);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleClear = () => {
    setLocalPredictions([]);
    setSelectedTeam(null);
  };

  // When a team is selected from the standings on mobile, gently scroll to the predictor section
  useEffect(() => {
    if (isMobile && selectedTeam && predictorRef.current) {
      predictorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isMobile, selectedTeam]);

  if (loading) {
    return (
      <StyledContainer>
        <Header />
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
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
              <Box>
                <Typography variant="h6" fontWeight="600" sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}>
                  Loading your predictions...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                  Preparing the ice 🏒
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer maxWidth={false} sx={{ py: 3 }}>
      <Header />
      
      <Container maxWidth="xl" sx={{ mt: 3, px: { xs: 2, sm: 3 } }}>
        <Box mb={3}>
          <DeadlineBar />
        </Box>
        
        {/* Success Message */}
        {showSuccessMessage && (
          <Alert
            severity="success"
            icon="✅"
            sx={{
              mb: 3,
              borderRadius: '12px',
              '& .MuiAlert-icon': { fontSize: '2rem' },
            }}
          >
            <Typography variant="h6" fontWeight="700" sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}>
              Predictions Saved!
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
              Your picks have been locked in. You can still edit them before the deadline!
            </Typography>
          </Alert>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <Alert
            severity="error"
            icon="❌"
            sx={{
              mb: 3,
              borderRadius: '12px',
              '& .MuiAlert-icon': { fontSize: '2rem' },
            }}
          >
            <Typography variant="h6" fontWeight="700" sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}>
              Error Saving
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
              {errorMessage}
            </Typography>
          </Alert>
        )}
        
        {/* Main Content - Side by Side */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 3,
            height: { xs: 'auto', lg: 'calc(100vh - 280px)' },
            width: '100%',
          }}
        >
          {/* LEFT SIDE - Team Pills Table */}
          <Box sx={{ flex: { xs: '0 0 100%', lg: '0 0 calc(50% - 12px)' } }}>
            <TeamPillsTable 
              predictions={localPredictions} 
              selectedTeam={selectedTeam}
              onTeamSelect={setSelectedTeam}
            />
          </Box>
          
          {/* RIGHT SIDE - User Predictions */}
          <Box
            ref={predictorRef}
            sx={{ flex: { xs: '0 0 100%', lg: '0 0 calc(50% - 12px)' } }}
          >
            <PredictionsPaper>
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
                  Your Predictions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                  {selectedTeam ? `Tap a slot to place ${selectedTeam.name}` : 'Tap teams from standings, then tap a slot'}
                </Typography>
                {submittedAt && (
                  <Chip
                    label={`Last saved: ${new Date(submittedAt).toLocaleDateString()}`}
                    size="small"
                    sx={{ mt: 1.5, fontFamily: 'Segoe UI, sans-serif' }}
                  />
                )}
              </Box>
              
              <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
                {/* Pool Closed Warning */}
                {!isActive && (
                  <Alert
                    severity="error"
                    icon="🔒"
                    sx={{ mb: 2, borderRadius: '12px', '& .MuiAlert-icon': { fontSize: '1.5rem' } }}
                  >
                    <Typography variant="subtitle1" fontWeight="700" sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}>
                      Pool Closed
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                      Predictions are locked. The deadline has passed!
                    </Typography>
                  </Alert>
                )}
                
                {/* Unsaved Changes Warning */}
                {hasUnsavedChanges && isActive && (
                  <Alert
                    severity="warning"
                    icon="⚠️"
                    sx={{ mb: 2, borderRadius: '12px', '& .MuiAlert-icon': { fontSize: '1.25rem' } }}
                  >
                    <Typography variant="subtitle2" fontWeight="700" sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 0.5 }}>
                      Unsaved Changes
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                      Don't forget to submit your predictions!
                    </Typography>
                  </Alert>
                )}
                
                {/* Prediction Slots */}
                <PredictionSlots
                  predictions={localPredictions}
                  onPredictionsChange={setLocalPredictions}
                  disabled={!isActive}
                  selectedTeam={selectedTeam}
                  onTeamSelect={setSelectedTeam}
                />

                {/* Clear and Submit Buttons */}
                {isActive && (
                  <Box sx={{ mt: 3 }}>
                    {/* Clear Selections Button */}
                    {localPredictions.length > 0 && (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={handleClear}
                        sx={{
                          mb: 2,
                          py: 1.5,
                          borderColor: 'error.main',
                          color: 'error.main',
                          '&:hover': {
                            borderColor: 'error.dark',
                            backgroundColor: 'error.light',
                            color: 'error.dark',
                          },
                          fontFamily: 'Segoe UI, sans-serif',
                          fontWeight: 600,
                          fontSize: '1rem',
                        }}
                      >
                        Clear Selections
                      </Button>
                    )}
                    
                    {/* Submit Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={!allSlotsFilled}
                      sx={{
                        py: 1.5,
                        background: allSlotsFilled
                          ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                          : 'grey.400',
                        '&:hover': allSlotsFilled
                          ? {
                              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                              boxShadow: 6,
                            }
                          : {},
                        fontFamily: 'Segoe UI, sans-serif',
                        fontWeight: 600,
                        fontSize: '1.125rem',
                      }}
                    >
                      {allSlotsFilled 
                          ? 'Submit Your Predictions' 
                          : `Fill all 8 slots (${localPredictions.length}/8)`
                      }
                    </Button>
                  </Box>
                )}

                {/* View Results Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/results')}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      color: 'primary.dark',
                      bgcolor: 'primary.light',
                    },
                    fontFamily: 'Segoe UI, sans-serif',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  🏆 View Results
                </Button>
              </Box>
            </PredictionsPaper>
          </Box>
        </Box>
      </Container>
      
      {/* Confirmation Modal */}
      <ConfirmSubmitModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        predictions={localPredictions}
      />

      {/* Waiver Modal */}
      <WaiverModal
        isOpen={showWaiverModal}
        onAccept={handleWaiverAccept}
        userName={users.find(u => u.id === userId)?.name || ''}
      />
    </StyledContainer>
  );
};

export default PredictionPage;

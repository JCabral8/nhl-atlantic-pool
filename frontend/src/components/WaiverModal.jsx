import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    maxWidth: '600px',
    maxHeight: '90vh',
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.3)',
    },
  },
}));

const SectionBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const WaiverModal = ({ isOpen, onAccept, userName }) => {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
    }
  };

  return (
    <StyledDialog
      open={isOpen}
      onClose={() => {}} // Prevent closing without accepting
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontFamily: 'Segoe UI, sans-serif',
          fontWeight: 700,
          fontSize: '1.5rem',
          textAlign: 'center',
          py: 3,
        }}
      >
        🏒 NHL Atlantic Pool - Waiver & Agreement
      </DialogTitle>

      <StyledDialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 1 }}
          >
            Welcome, {userName}!
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontFamily: 'Segoe UI, sans-serif', color: 'text.secondary' }}
          >
            Before you can make your predictions, please read and accept the following terms:
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <SectionBox>
          <Typography
            variant="h6"
            fontWeight="700"
            sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 2, color: 'primary.main' }}
          >
            📋 Rules
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Predict the final standings of all 8 teams in the NHL Atlantic Division"
                primaryTypographyProps={{
                  fontFamily: 'Segoe UI, sans-serif',
                  fontSize: '0.95rem',
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Rank teams from 1st place (best) to 8th place (worst)"
                primaryTypographyProps={{
                  fontFamily: 'Segoe UI, sans-serif',
                  fontSize: '0.95rem',
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="All predictions must be submitted before the deadline"
                primaryTypographyProps={{
                  fontFamily: 'Segoe UI, sans-serif',
                  fontSize: '0.95rem',
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Once submitted, predictions cannot be changed"
                primaryTypographyProps={{
                  fontFamily: 'Segoe UI, sans-serif',
                  fontSize: '0.95rem',
                }}
              />
            </ListItem>
          </List>
        </SectionBox>

        <SectionBox>
          <Typography
            variant="h6"
            fontWeight="700"
            sx={{ fontFamily: 'Segoe UI, sans-serif', mb: 2, color: 'primary.main' }}
          >
            🎯 Scoring System
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary={
                  <Box>
                    <Typography
                      component="span"
                      fontWeight="600"
                      sx={{ fontFamily: 'Segoe UI, sans-serif', color: '#10b981' }}
                    >
                      Exact Match (3 points):
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontFamily: 'Segoe UI, sans-serif', ml: 1 }}
                    >
                      Your predicted rank matches the actual final rank
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <Box>
                    <Typography
                      component="span"
                      fontWeight="600"
                      sx={{ fontFamily: 'Segoe UI, sans-serif', color: '#fbbf24' }}
                    >
                      Off-by-One (1 point):
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontFamily: 'Segoe UI, sans-serif', ml: 1 }}
                    >
                      Your predicted rank is one position away from the actual rank
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <Box>
                    <Typography
                      component="span"
                      fontWeight="600"
                      sx={{ fontFamily: 'Segoe UI, sans-serif', color: '#ef4444' }}
                    >
                      Off-by-Two or More (0 points):
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontFamily: 'Segoe UI, sans-serif', ml: 1 }}
                    >
                      Your predicted rank is two or more positions away from the actual rank
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      component="span"
                      fontWeight="600"
                      sx={{ fontFamily: 'Segoe UI, sans-serif' }}
                    >
                      Maximum Possible Score: 24 points
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontFamily: 'Segoe UI, sans-serif', ml: 1, color: 'text.secondary' }}
                    >
                      (8 teams × 3 points each)
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          </List>
        </SectionBox>

        <Divider sx={{ my: 3 }} />

        <SectionBox>
          <Typography
            variant="h6"
            fontWeight="700"
            sx={{
              fontFamily: 'Segoe UI, sans-serif',
              mb: 2,
              color: 'error.main',
              textAlign: 'center',
            }}
          >
            🍺 Payment Agreement
          </Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <Typography
              variant="body1"
              fontWeight="600"
              sx={{
                fontFamily: 'Segoe UI, sans-serif',
                textAlign: 'center',
                color: 'error.main',
              }}
            >
              By accepting this waiver, you agree to pay the winner:
            </Typography>
            <Typography
              variant="h5"
              fontWeight="700"
              sx={{
                fontFamily: 'Segoe UI, sans-serif',
                textAlign: 'center',
                color: 'error.main',
                mt: 1,
                mb: 1,
              }}
            >
              6 Tall Stella Artois (or equivalent)
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'Segoe UI, sans-serif',
                textAlign: 'center',
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              Payment must be made promptly upon conclusion of the NHL season
            </Typography>
          </Box>
        </SectionBox>

        <Divider sx={{ my: 3 }} />

        <FormControlLabel
          control={
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              sx={{
                color: 'primary.main',
                '&.Mui-checked': {
                  color: 'primary.main',
                },
              }}
            />
          }
          label={
            <Typography
              variant="body1"
              fontWeight="600"
              sx={{ fontFamily: 'Segoe UI, sans-serif' }}
            >
              I have read and agree to the rules, scoring system, and payment agreement
            </Typography>
          }
        />
      </StyledDialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleAccept}
          disabled={!agreed}
          fullWidth
          sx={{
            background: agreed
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'grey.400',
            '&:hover': agreed
              ? {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: 6,
                }
              : {},
            fontFamily: 'Segoe UI, sans-serif',
            fontWeight: 600,
            fontSize: '1.125rem',
            py: 1.5,
          }}
        >
          {agreed ? '✅ Accept & Continue' : 'Please Accept Terms to Continue'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default WaiverModal;


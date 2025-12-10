import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import AvatarCustomizationModal from './AvatarCustomizationModal';
import { AppBar, Toolbar, Typography, Box, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
}));

const Header = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);

  return (
    <StyledAppBar position="sticky">
      <Toolbar sx={{ maxWidth: '1400px', mx: 'auto', width: '100%', px: { xs: 2, md: 3 } }}>
        <Button
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            textTransform: 'none',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Typography variant="h4">🏒</Typography>
          <Box>
            <Typography
              variant="h6"
              fontWeight="700"
              sx={{
                fontFamily: 'Segoe UI, sans-serif',
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              NHL Atlantic Pool
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'Segoe UI, sans-serif',
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'block',
              }}
            >
              Prediction Challenge
            </Typography>
          </Box>
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {currentUser && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Chip
                avatar={<Avatar key={avatarKey} userId={currentUser.id} name={currentUser.name} size={40} />}
                label={
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif', display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Playing as
                    </Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                      {currentUser.name}
                    </Typography>
                  </Box>
                }
                sx={{
                  height: 'auto',
                  py: 1,
                  px: 2,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '& .MuiChip-avatar': {
                    width: 40,
                    height: 40,
                  },
                }}
              />
              <Tooltip title="Change Avatar">
                <IconButton
                  size="small"
                  onClick={() => setAvatarModalOpen(true)}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 28,
                    height: 28,
                    border: '2px solid white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                },
                fontFamily: 'Segoe UI, sans-serif',
                fontWeight: 600,
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                Change User
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                Change
              </Box>
            </Button>
          </Box>
        )}
        
        {/* Avatar Customization Modal */}
        {currentUser && (
          <AvatarCustomizationModal
            isOpen={avatarModalOpen}
            onClose={() => setAvatarModalOpen(false)}
            userId={currentUser.id}
            userName={currentUser.name}
            onAvatarUpdate={() => {
              // Force Avatar component to re-fetch preferences
              setAvatarKey(prev => prev + 1);
            }}
          />
        )}
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;

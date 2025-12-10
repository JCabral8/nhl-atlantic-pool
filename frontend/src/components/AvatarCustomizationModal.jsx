import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import axios from 'axios';

const PreviewBox = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})(({ theme, isSelected }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: `2px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: 4,
  },
}));

const AvatarCustomizationModal = ({ isOpen, onClose, userId, userName, onAvatarUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [currentPreferences, setCurrentPreferences] = useState(null);

  // Default avatar options
  const defaultOptions = {
    nick: {
      skinColor: 'fdbcb4',
      hairColor: 'c93305',
      top: 'shortHairShortFlat',
    },
    justin: {
      skinColor: 'edb98a',
      hairColor: '2c1b18',
      top: 'longHairStraight',
      facialHair: 'beardMajestic',
      facialHairColor: '2c1b18',
    },
    chris: {
      skinColor: 'fdbcb4',
      hairColor: '6d4c41',
      top: 'shortHairShortRound',
    },
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadPreferences();
    }
  }, [isOpen, userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/users/${userId}/avatar`);
      const saved = response.data.preferences;
      const defaults = defaultOptions[userId] || defaultOptions.nick;
      setCurrentPreferences(saved || defaults);
      setPreferences(saved || defaults);
    } catch (error) {
      console.error('Error loading preferences:', error);
      const defaults = defaultOptions[userId] || defaultOptions.nick;
      setCurrentPreferences(defaults);
      setPreferences(defaults);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`http://localhost:3001/api/users/${userId}/avatar`, {
        preferences: currentPreferences,
      });
      if (onAvatarUpdate) onAvatarUpdate(currentPreferences);
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save avatar preferences');
    } finally {
      setSaving(false);
    }
  };

  const generatePreview = (prefs) => {
    if (!prefs) return '';
    
    // Get default top from user defaults
    const defaultTop = defaultOptions[userId]?.top || 'shortHairShortFlat';
    
    const options = {
      size: 120,
      seed: `${userName}-${userId}`,
      skinColor: [prefs.skinColor || 'fdbcb4'],
      hairColor: [prefs.hairColor || '2c1b18'],
      top: [prefs.top || defaultTop], // Always include top
    };
    
    // Only add facialHair if it exists and is not Blank
    if (prefs.facialHair && prefs.facialHair !== 'Blank') {
      options.facialHair = [prefs.facialHair];
      if (prefs.facialHairColor) {
        options.facialHairColor = [prefs.facialHairColor];
      }
    }
    
    // Add expression options
    if (prefs.eyes && prefs.eyes !== 'default') {
      options.eyes = [prefs.eyes];
    }
    if (prefs.mouth && prefs.mouth !== 'default') {
      options.mouth = [prefs.mouth];
    }
    if (prefs.eyebrows && prefs.eyebrows !== 'default') {
      options.eyebrows = [prefs.eyebrows];
    }
    
    try {
      const avatar = createAvatar(avataaars, options);
      return avatar.toDataUri();
    } catch (error) {
      console.error('Error generating preview:', error, options);
      return '';
    }
  };

  const skinColors = [
    { value: 'fdbcb4', label: 'Pale' },
    { value: 'edb98a', label: 'Light' },
    { value: 'd08b5b', label: 'Medium' },
    { value: 'ae5d29', label: 'Tanned' },
    { value: '614335', label: 'Dark' },
  ];

  const hairColors = [
    { value: '2c1b18', label: 'Black' },
    { value: '6d4c41', label: 'Brown' },
    { value: 'c93305', label: 'Dirty Blonde' },
    { value: 'a55728', label: 'Auburn' },
    { value: 'b58143', label: 'Blonde' },
  ];

  const hairStyles = [
    { value: 'shortHairShortFlat', label: 'Short Flat' },
    { value: 'shortHairShortRound', label: 'Short Round' },
    { value: 'shortHairTheCaesar', label: 'Caesar' },
    { value: 'shortHairDreads01', label: 'Dreads' },
    { value: 'shortHairFrizzle', label: 'Frizzle' },
    { value: 'shortHairShaggyMullet', label: 'Shaggy Mullet' },
    { value: 'longHairBob', label: 'Bob' },
    { value: 'longHairCurly', label: 'Curly' },
    { value: 'longHairStraight', label: 'Straight' },
    { value: 'longHairDreads', label: 'Long Dreads' },
    { value: 'longHairFrida', label: 'Frida' },
    { value: 'longHairShaggyMullet', label: 'Mullet' },
    { value: 'longHairMiaWallace', label: 'Mia Wallace' },
    { value: 'longHairBigHair', label: 'Big Hair' },
    { value: 'longHairBun', label: 'Bun' },
    { value: 'longHairNotTooLong', label: 'Not Too Long' },
  ];

  const facialHairStyles = [
    { value: 'Blank', label: 'None' },
    { value: 'beardLight', label: 'Light Beard' },
    { value: 'beardMedium', label: 'Medium Beard' },
    { value: 'beardMajestic', label: 'Full Beard' },
    { value: 'moustacheFancy', label: 'Fancy Moustache' },
    { value: 'moustacheMagnum', label: 'Magnum Moustache' },
  ];

  const eyeStyles = [
    { value: 'default', label: 'Default' },
    { value: 'happy', label: 'Happy' },
    { value: 'wink', label: 'Wink' },
    { value: 'winkWacky', label: 'Wink Wacky' },
    { value: 'squint', label: 'Squint' },
    { value: 'closed', label: 'Closed' },
    { value: 'cry', label: 'Cry' },
    { value: 'eyeRoll', label: 'Eye Roll' },
    { value: 'hearts', label: 'Hearts' },
    { value: 'surprised', label: 'Surprised' },
  ];

  const mouthStyles = [
    { value: 'default', label: 'Default' },
    { value: 'smile', label: 'Smile' },
    { value: 'sad', label: 'Sad' },
    { value: 'open', label: 'Open' },
    { value: 'openSmile', label: 'Open Smile' },
    { value: 'serious', label: 'Serious' },
    { value: 'tongue', label: 'Tongue' },
    { value: 'twinkle', label: 'Twinkle' },
    { value: 'vomit', label: 'Vomit' },
  ];

  const eyebrowStyles = [
    { value: 'default', label: 'Default' },
    { value: 'defaultNatural', label: 'Natural' },
    { value: 'flatNatural', label: 'Flat Natural' },
    { value: 'raisedExcited', label: 'Raised Excited' },
    { value: 'raisedExcitedNatural', label: 'Raised Natural' },
    { value: 'unibrowNatural', label: 'Unibrow' },
    { value: 'upDown', label: 'Up Down' },
    { value: 'upDownNatural', label: 'Up Down Natural' },
    { value: 'angry', label: 'Angry' },
    { value: 'angryNatural', label: 'Angry Natural' },
  ];

  if (loading) {
    return (
      <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography component="span" variant="h6" fontWeight="700" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
          Customize Your Avatar
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ position: 'relative' }}>
        {/* Preview - Sticky */}
        <Box
          textAlign="center"
          mb={4}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            py: 2,
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 80%, rgba(255, 255, 255, 0) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Paper
            sx={{
              p: 3,
              display: 'inline-block',
              borderRadius: '16px',
              background: 'rgba(0, 0, 0, 0.02)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            <img
              src={currentPreferences ? generatePreview(currentPreferences) : ''}
              alt="Avatar Preview"
              style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                border: '4px solid rgba(0, 0, 0, 0.1)',
              }}
            />
          </Paper>
        </Box>

        {/* Skin Color */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Skin Color
          </Typography>
          <Grid container spacing={2}>
            {skinColors.map((color) => (
              <Grid size={{ xs: 4, sm: 2.4 }} key={color.value}>
                <PreviewBox
                  isSelected={currentPreferences?.skinColor === color.value}
                  onClick={() => setCurrentPreferences({ ...currentPreferences, skinColor: color.value })}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: `#${color.value}`,
                      mx: 'auto',
                      mb: 1,
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                    {color.label}
                  </Typography>
                </PreviewBox>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Hair Color */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Hair Color
          </Typography>
          <Grid container spacing={2}>
            {hairColors.map((color) => (
              <Grid size={{ xs: 4, sm: 2.4 }} key={color.value}>
                <PreviewBox
                  isSelected={currentPreferences?.hairColor === color.value}
                  onClick={() => setCurrentPreferences({ ...currentPreferences, hairColor: color.value })}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: `#${color.value}`,
                      mx: 'auto',
                      mb: 1,
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                    {color.label}
                  </Typography>
                </PreviewBox>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Hair Style */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Hair Style
          </Typography>
          <Grid container spacing={2}>
            {hairStyles.map((style) => (
              <Grid size={{ xs: 6, sm: 4 }} key={style.value}>
                <PreviewBox
                  isSelected={currentPreferences?.top === style.value}
                  onClick={() => {
                    const newPrefs = { ...currentPreferences, top: style.value };
                    setCurrentPreferences(newPrefs);
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '8px',
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                      mx: 'auto',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={generatePreview({ ...currentPreferences, top: style.value })}
                      alt={style.label}
                      style={{ width: 50, height: 50, borderRadius: '50%' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                    {style.label}
                  </Typography>
                </PreviewBox>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Eyes */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Eye Expression
          </Typography>
          <Grid container spacing={2}>
            {eyeStyles.map((style) => (
              <Grid size={{ xs: 4, sm: 2.4 }} key={style.value}>
                <PreviewBox
                  isSelected={currentPreferences?.eyes === style.value || (!currentPreferences?.eyes && style.value === 'default')}
                  onClick={() => setCurrentPreferences({ ...currentPreferences, eyes: style.value === 'default' ? undefined : style.value })}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '8px',
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                      mx: 'auto',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={generatePreview({ ...currentPreferences, eyes: style.value === 'default' ? undefined : style.value })}
                      alt={style.label}
                      style={{ width: 50, height: 50, borderRadius: '50%' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                    {style.label}
                  </Typography>
                </PreviewBox>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Mouth */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Mouth Expression
          </Typography>
          <Grid container spacing={2}>
            {mouthStyles.map((style) => (
              <Grid size={{ xs: 4, sm: 2.4 }} key={style.value}>
                <PreviewBox
                  isSelected={currentPreferences?.mouth === style.value || (!currentPreferences?.mouth && style.value === 'default')}
                  onClick={() => setCurrentPreferences({ ...currentPreferences, mouth: style.value === 'default' ? undefined : style.value })}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '8px',
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                      mx: 'auto',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={generatePreview({ ...currentPreferences, mouth: style.value === 'default' ? undefined : style.value })}
                      alt={style.label}
                      style={{ width: 50, height: 50, borderRadius: '50%' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                    {style.label}
                  </Typography>
                </PreviewBox>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Eyebrows */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Eyebrows
          </Typography>
          <Grid container spacing={2}>
            {eyebrowStyles.map((style) => (
              <Grid size={{ xs: 4, sm: 2.4 }} key={style.value}>
                <PreviewBox
                  isSelected={currentPreferences?.eyebrows === style.value || (!currentPreferences?.eyebrows && style.value === 'default')}
                  onClick={() => setCurrentPreferences({ ...currentPreferences, eyebrows: style.value === 'default' ? undefined : style.value })}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '8px',
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                      mx: 'auto',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={generatePreview({ ...currentPreferences, eyebrows: style.value === 'default' ? undefined : style.value })}
                      alt={style.label}
                      style={{ width: 50, height: 50, borderRadius: '50%' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                    {style.label}
                  </Typography>
                </PreviewBox>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Facial Hair (if applicable) */}
        {(userId === 'justin' || currentPreferences?.facialHair) && (
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
              Facial Hair
            </Typography>
            <Grid container spacing={2}>
              {facialHairStyles.map((style) => (
                <Grid size={{ xs: 6, sm: 3 }} key={style.value}>
                  <PreviewBox
                    isSelected={
                      (style.value === 'Blank' && !currentPreferences?.facialHair) ||
                      currentPreferences?.facialHair === style.value
                    }
                    onClick={() => {
                      const newPrefs = { ...currentPreferences };
                      if (style.value === 'Blank') {
                        delete newPrefs.facialHair;
                        delete newPrefs.facialHairColor;
                      } else {
                        newPrefs.facialHair = style.value;
                        newPrefs.facialHairColor = newPrefs.facialHairColor || currentPreferences?.hairColor || '2c1b18';
                      }
                      setCurrentPreferences(newPrefs);
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '8px',
                        bgcolor: 'rgba(0, 0, 0, 0.05)',
                        mx: 'auto',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {style.value !== 'Blank' && (
                        <img
                          src={generatePreview({
                            ...currentPreferences,
                            facialHair: style.value,
                            facialHairColor: currentPreferences?.facialHairColor || currentPreferences?.hairColor || '2c1b18',
                          })}
                          alt={style.label}
                          style={{ width: 50, height: 50, borderRadius: '50%' }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                      {style.label}
                    </Typography>
                  </PreviewBox>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ fontFamily: 'Segoe UI, sans-serif', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            },
            fontFamily: 'Segoe UI, sans-serif',
            fontWeight: 600,
          }}
        >
          {saving ? <CircularProgress size={20} /> : 'Save Avatar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarCustomizationModal;


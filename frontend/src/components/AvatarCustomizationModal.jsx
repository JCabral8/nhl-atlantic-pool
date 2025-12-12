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
import { useApp } from '../context/AppContext';

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
  const { API_BASE } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [currentPreferences, setCurrentPreferences] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('skin');

  // Default avatar options
  const defaultOptions = {
    nick: {
      skinColor: 'fdbcb4',
      hairColor: 'c93305',
      top: 'shortFlat',
      clothing: 'shirtCrewNeck',
      clothesColor: '262e33',
    },
    justin: {
      skinColor: 'edb98a',
      hairColor: '2c1b18',
      top: 'straight01',
      facialHair: 'beardMajestic',
      facialHairColor: '2c1b18',
      clothing: 'shirtCrewNeck',
      clothesColor: '262e33',
    },
    chris: {
      skinColor: 'fdbcb4',
      hairColor: '6d4c41',
      top: 'shortRound',
      clothing: 'shirtCrewNeck',
      clothesColor: '262e33',
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
      const response = await axios.get(`${API_BASE}/users/${userId}/avatar`);
      const saved = response.data.preferences;
      const defaults = defaultOptions[userId] || defaultOptions.nick;
      // Merge saved preferences with defaults to ensure all properties are present
      const merged = saved ? { ...defaults, ...saved } : defaults;
      setCurrentPreferences(merged);
      setPreferences(merged);
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
      await axios.put(`${API_BASE}/users/${userId}/avatar`, {
        preferences: currentPreferences,
      });
      if (onAvatarUpdate) onAvatarUpdate(currentPreferences);
      // Dispatch custom event to notify all Avatar components to refresh
      window.dispatchEvent(new CustomEvent('avatarPreferencesUpdated', { 
        detail: { userId, preferences: currentPreferences } 
      }));
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
    const defaultTop = defaultOptions[userId]?.top || 'shortFlat';
    const topValue = prefs.top || defaultTop;
    
    // Always set a consistent clothing to prevent random variation
    // Use user's preference or default to a simple shirt
    const clothingValue = prefs.clothing || 'shirtCrewNeck';
    
    // Use a stable seed that doesn't change with hair/facial hair
    // This prevents expressions from changing when hair changes
    const stableSeed = `${userName}-${userId}-stable`;
    const options = {
      size: 120,
      // Use stable seed to prevent random expression changes
      seed: stableSeed,
      // Dicebear v9 requires arrays for style options
      skinColor: [prefs.skinColor || 'fdbcb4'],
      hairColor: [prefs.hairColor || '2c1b18'],
      top: [topValue], // 'top' is correct for avataaars
      clothing: [clothingValue], // Always set clothing to keep it consistent
      clothesColor: [prefs.clothesColor || '262e33'], // Clothing color
      // Disable random accessories (glasses) unless explicitly set
      accessoriesProbability: prefs.accessories ? 100 : 0,
    };
    
    // Only add facialHair if it exists and is not Blank
    if (prefs.facialHair && prefs.facialHair !== 'Blank') {
      options.facialHair = [prefs.facialHair];
      // Always provide facialHairColor when facialHair is set, default to hairColor if not specified
      options.facialHairColor = [prefs.facialHairColor || prefs.hairColor || '2c1b18'];
      // Set facialHairProbability to 100 to ensure facial hair is displayed
      options.facialHairProbability = 100;
    } else {
      // Explicitly disable facial hair if not set
      options.facialHairProbability = 0;
    }
    
    // ALWAYS explicitly set expression options to preserve them
    // If not set, use defaults to prevent random changes
    options.eyes = prefs.eyes && prefs.eyes !== 'default' ? [prefs.eyes] : ['default'];
    options.mouth = prefs.mouth && prefs.mouth !== 'default' ? [prefs.mouth] : ['default'];
    options.eyebrows = prefs.eyebrows && prefs.eyebrows !== 'default' ? [prefs.eyebrows] : ['default'];
    
    // Only add accessories if explicitly set
    if (prefs.accessories && prefs.accessories !== 'Blank') {
      options.accessories = [prefs.accessories];
    }
    
    try {
      const avatar = createAvatar(avataaars, options);
      return avatar.toDataUri();
    } catch (error) {
      console.error('Error generating preview:', error);
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

  const facialHairColors = [
    { value: '2c1b18', label: 'Black' },
    { value: '6d4c41', label: 'Brown' },
    { value: 'c93305', label: 'Dirty Blonde' },
    { value: 'a55728', label: 'Auburn' },
    { value: 'b58143', label: 'Blonde' },
    { value: 'c27e3a', label: 'Ginger' },
    { value: '915533', label: 'Dark Brown' },
  ];

  const clothesColors = [
    { value: '262e33', label: 'Black' },
    { value: '65c9ff', label: 'Blue' },
    { value: '5199e4', label: 'Navy' },
    { value: '25557c', label: 'Dark Blue' },
    { value: 'e6e6fa', label: 'Lavender' },
    { value: 'fcbc4e', label: 'Yellow' },
    { value: 'a7ffc4', label: 'Mint' },
    { value: 'ff488e', label: 'Pink' },
    { value: 'ffffff', label: 'White' },
    { value: 'ff5c5c', label: 'Red' },
    { value: '72cb66', label: 'Green' },
    { value: 'b9b9b9', label: 'Grey' },
  ];

  const hairStyles = [
    { value: 'shortFlat', label: 'Short Flat' },
    { value: 'shortRound', label: 'Short Round' },
    { value: 'theCaesar', label: 'Caesar' },
    { value: 'dreads01', label: 'Dreads' },
    { value: 'frizzle', label: 'Frizzle' },
    { value: 'shaggyMullet', label: 'Shaggy Mullet' },
    { value: 'bob', label: 'Bob' },
    { value: 'curly', label: 'Curly' },
    { value: 'straight01', label: 'Straight' },
    { value: 'straight02', label: 'Straight 2' },
    { value: 'dreads', label: 'Long Dreads' },
    { value: 'dreads02', label: 'Dreads 2' },
    { value: 'frida', label: 'Frida' },
    { value: 'miaWallace', label: 'Mia Wallace' },
    { value: 'bigHair', label: 'Big Hair' },
    { value: 'bun', label: 'Bun' },
    { value: 'longButNotTooLong', label: 'Not Too Long' },
    { value: 'curvy', label: 'Curvy' },
    { value: 'fro', label: 'Fro' },
    { value: 'froBand', label: 'Fro Band' },
    { value: 'shavedSides', label: 'Shaved Sides' },
    { value: 'straightAndStrand', label: 'Straight & Strand' },
    { value: 'shortCurly', label: 'Short Curly' },
    { value: 'shortWaved', label: 'Short Waved' },
    { value: 'sides', label: 'Sides' },
    { value: 'theCaesarAndSidePart', label: 'Caesar & Side Part' },
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

  const clothingStyles = [
    { value: 'shirtCrewNeck', label: 'Crew Neck' },
    { value: 'shirtScoopNeck', label: 'Scoop Neck' },
    { value: 'shirtVNeck', label: 'V-Neck' },
    { value: 'graphicShirt', label: 'Graphic Shirt' },
    { value: 'hoodie', label: 'Hoodie' },
    { value: 'blazerAndShirt', label: 'Blazer & Shirt' },
    { value: 'blazerAndSweater', label: 'Blazer & Sweater' },
    { value: 'collarAndSweater', label: 'Collar & Sweater' },
    { value: 'overall', label: 'Overall' },
  ];

  const categories = [
    { id: 'skin', label: 'Skin Color', emoji: '👤' },
    { id: 'hairColor', label: 'Hair Color', emoji: '🎨' },
    { id: 'hairStyle', label: 'Hair Style', emoji: '💇' },
    { id: 'facialHair', label: 'Facial Hair', emoji: '🧔' },
    { id: 'clothing', label: 'Clothing', emoji: '👕' },
    { id: 'eyes', label: 'Eye Expression', emoji: '👁️' },
    { id: 'mouth', label: 'Mouth Expression', emoji: '😊' },
    { id: 'eyebrows', label: 'Eyebrows', emoji: '🤨' },
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

        {/* Category Selector */}
        <Box mb={4} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Grid container spacing={2} sx={{ maxWidth: '800px', justifyContent: 'center' }}>
            {categories.map((category) => (
              <Grid size={{ xs: 6, sm: 3, md: 'auto' }} key={category.id}>
                <Button
                  fullWidth
                  variant={selectedCategory === category.id ? 'contained' : 'outlined'}
                  onClick={() => setSelectedCategory(category.id)}
                  sx={{
                    fontFamily: 'Segoe UI, sans-serif',
                    fontWeight: 600,
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    ...(selectedCategory === category.id
                      ? {
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                          },
                        }
                      : {}),
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="h6" component="span">
                      {category.emoji}
                    </Typography>
                    <Typography variant="caption" component="span" sx={{ fontSize: '0.75rem' }}>
                      {category.label}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Options based on selected category */}
        {selectedCategory === 'skin' && (
          <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Skin Color
          </Typography>
          <Grid container spacing={2}>
            {skinColors.map((color) => (
              <Grid size={{ xs: 6, sm: 4 }} key={color.value}>
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
        )}

        {selectedCategory === 'hairColor' && (
          <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Hair Color
          </Typography>
          <Grid container spacing={2}>
            {hairColors.map((color) => (
              <Grid size={{ xs: 6, sm: 4 }} key={color.value}>
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
        )}

        {selectedCategory === 'hairStyle' && (
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
                      src={generatePreview({ 
                        ...(currentPreferences || {}), 
                        top: style.value,
                        skinColor: currentPreferences?.skinColor || defaultOptions[userId]?.skinColor || 'fdbcb4',
                        hairColor: currentPreferences?.hairColor || defaultOptions[userId]?.hairColor || '2c1b18',
                        clothing: currentPreferences?.clothing || defaultOptions[userId]?.clothing || 'shirtCrewNeck',
                        clothesColor: currentPreferences?.clothesColor || defaultOptions[userId]?.clothesColor || '262e33',
                        // Preserve expression preferences
                        eyes: currentPreferences?.eyes || 'default',
                        mouth: currentPreferences?.mouth || 'default',
                        eyebrows: currentPreferences?.eyebrows || 'default',
                        facialHair: currentPreferences?.facialHair,
                        facialHairColor: currentPreferences?.facialHairColor,
                      })}
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
        )}

        {selectedCategory === 'clothing' && (
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
              Clothing
            </Typography>
            <Grid container spacing={2}>
              {clothingStyles.map((style) => (
                <Grid size={{ xs: 6, sm: 4 }} key={style.value}>
                  <PreviewBox
                    isSelected={currentPreferences?.clothing === style.value}
                    onClick={() => {
                      const newPrefs = { ...currentPreferences, clothing: style.value };
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
                        src={generatePreview({
                          ...(currentPreferences || {}),
                          clothing: style.value,
                          skinColor: currentPreferences?.skinColor || defaultOptions[userId]?.skinColor || 'fdbcb4',
                          hairColor: currentPreferences?.hairColor || defaultOptions[userId]?.hairColor || '2c1b18',
                          top: currentPreferences?.top || defaultOptions[userId]?.top || 'shortFlat',
                          clothesColor: currentPreferences?.clothesColor || defaultOptions[userId]?.clothesColor || '262e33',
                        })}
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

          {/* Clothing Color */}
          <Box mt={4}>
            <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
              Clothing Color
            </Typography>
            <Grid container spacing={2}>
              {clothesColors.map((color) => (
                <Grid size={{ xs: 6, sm: 4 }} key={color.value}>
                  <PreviewBox
                    isSelected={currentPreferences?.clothesColor === color.value}
                    onClick={() => setCurrentPreferences({ ...currentPreferences, clothesColor: color.value })}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
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
          </Box>
        )}

        {selectedCategory === 'eyes' && (
          <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Eye Expression
          </Typography>
          <Grid container spacing={2}>
            {eyeStyles.map((style) => (
              <Grid size={{ xs: 6, sm: 4 }} key={style.value}>
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
                      src={generatePreview({
                        ...currentPreferences,
                        eyes: style.value === 'default' ? undefined : style.value,
                        clothing: currentPreferences?.clothing || defaultOptions[userId]?.clothing || 'shirtCrewNeck',
                        clothesColor: currentPreferences?.clothesColor || defaultOptions[userId]?.clothesColor || '262e33',
                      })}
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
        )}

        {selectedCategory === 'mouth' && (
          <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Mouth Expression
          </Typography>
          <Grid container spacing={2}>
            {mouthStyles.map((style) => (
              <Grid size={{ xs: 6, sm: 4 }} key={style.value}>
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
                      src={generatePreview({
                        ...currentPreferences,
                        mouth: style.value === 'default' ? undefined : style.value,
                        clothing: currentPreferences?.clothing || defaultOptions[userId]?.clothing || 'shirtCrewNeck',
                        clothesColor: currentPreferences?.clothesColor || defaultOptions[userId]?.clothesColor || '262e33',
                      })}
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
        )}

        {selectedCategory === 'eyebrows' && (
          <Box mb={3}>
          <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
            Eyebrows
          </Typography>
          <Grid container spacing={2}>
            {eyebrowStyles.map((style) => (
              <Grid size={{ xs: 6, sm: 4 }} key={style.value}>
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
                      src={generatePreview({
                        ...currentPreferences,
                        eyebrows: style.value === 'default' ? undefined : style.value,
                        clothing: currentPreferences?.clothing || defaultOptions[userId]?.clothing || 'shirtCrewNeck',
                        clothesColor: currentPreferences?.clothesColor || defaultOptions[userId]?.clothesColor || '262e33',
                      })}
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
        )}

        {selectedCategory === 'facialHair' && (
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
              Facial Hair
            </Typography>
            <Grid container spacing={2}>
              {facialHairStyles.map((style) => (
                <Grid size={{ xs: 6, sm: 4 }} key={style.value}>
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
                      {style.value !== 'Blank' ? (
                        <img
                          src={generatePreview({
                            ...currentPreferences,
                            top: currentPreferences?.top || defaultOptions[userId]?.top || 'shortFlat',
                            skinColor: currentPreferences?.skinColor || defaultOptions[userId]?.skinColor || 'fdbcb4',
                            hairColor: currentPreferences?.hairColor || defaultOptions[userId]?.hairColor || '2c1b18',
                            clothing: currentPreferences?.clothing || defaultOptions[userId]?.clothing || 'shirtCrewNeck',
                            clothesColor: currentPreferences?.clothesColor || defaultOptions[userId]?.clothesColor || '262e33',
                            facialHair: style.value,
                            facialHairColor: currentPreferences?.facialHairColor || currentPreferences?.hairColor || defaultOptions[userId]?.hairColor || '2c1b18',
                            // Preserve expression preferences
                            eyes: currentPreferences?.eyes || 'default',
                            mouth: currentPreferences?.mouth || 'default',
                            eyebrows: currentPreferences?.eyebrows || 'default',
                          })}
                          alt={style.label}
                          style={{ width: 50, height: 50, borderRadius: '50%' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            bgcolor: 'rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            None
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                      {style.label}
                    </Typography>
                  </PreviewBox>
                </Grid>
              ))}
            </Grid>

            {/* Facial Hair Color - only show if facial hair is selected */}
            {currentPreferences?.facialHair && currentPreferences?.facialHair !== 'Blank' && (
              <Box mt={4}>
                <Typography variant="subtitle1" fontWeight="600" mb={2} sx={{ fontFamily: 'Segoe UI, sans-serif' }}>
                  Beard/Moustache Color
                </Typography>
                <Grid container spacing={2}>
                  {facialHairColors.map((color) => (
                    <Grid size={{ xs: 6, sm: 4 }} key={color.value}>
                      <PreviewBox
                        isSelected={currentPreferences?.facialHairColor === color.value}
                        onClick={() => setCurrentPreferences({ ...currentPreferences, facialHairColor: color.value })}
                      >
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
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
            )}
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


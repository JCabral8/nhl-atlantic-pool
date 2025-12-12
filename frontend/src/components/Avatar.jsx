import { useMemo, useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import axios from 'axios';
import { useApp } from '../context/AppContext';

const Avatar = ({ userId, name, size = 120, preferences: externalPreferences }) => {
  const { API_BASE } = useApp();
  const [savedPreferences, setSavedPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  // Default avatar config
  const defaultConfig = {
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
    if (!userId) {
      return;
    }
    
    if (externalPreferences) {
      setSavedPreferences(externalPreferences);
      return;
    }
    
    // Only load from API if we don't have external preferences
    // Make it non-blocking - don't wait for it
    const loadPreferences = async () => {
      try {
        const response = await axios.get(`${API_BASE}/users/${userId}/avatar`, {
          timeout: 1000,
        });
        if (response.data && response.data.preferences) {
          setSavedPreferences(response.data.preferences);
        }
      } catch (error) {
        // Silently fail - use defaults
      }
    };
    
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, externalPreferences]);

  // Listen for avatar preference updates
  useEffect(() => {
    if (!userId || externalPreferences) {
      return;
    }

    const handleAvatarUpdate = async (event) => {
      // Reload preferences if this avatar's userId matches the updated one
      if (event.detail && event.detail.userId === userId) {
        try {
          const response = await axios.get(`${API_BASE}/users/${userId}/avatar`, {
            timeout: 1000,
          });
          if (response.data && response.data.preferences) {
            setSavedPreferences(response.data.preferences);
          }
        } catch (error) {
          // Silently fail
        }
      }
    };

    window.addEventListener('avatarPreferencesUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatarPreferencesUpdated', handleAvatarUpdate);
    };
  }, [userId, externalPreferences, API_BASE]);

  const avatarUrl = useMemo(() => {
    if (!userId || !name) {
      return null;
    }

    // Use external preferences if provided, otherwise use saved, otherwise defaults
    const preferences = externalPreferences || savedPreferences;
    const defaults = defaultConfig[userId] || defaultConfig.nick;
    // Merge saved preferences with defaults to ensure all properties are present
    const config = preferences ? { ...defaults, ...preferences } : defaults;

    if (!config || !config.skinColor || !config.hairColor || !config.top) {
      return null;
    }

    try {
    // Use stable seed to prevent expression changes when hair/facial hair changes
    const stableSeed = `${name}-${userId}-stable`;
    const avatarOptions = {
      size: size,
      seed: stableSeed,
      // Dicebear v9 requires arrays for style options
      skinColor: [config.skinColor],
      hairColor: [config.hairColor],
      top: [config.top], // 'top' is correct for avataaars
      clothing: [config.clothing || 'shirtCrewNeck'], // Always set clothing to keep it consistent
      clothesColor: [config.clothesColor || '262e33'], // Clothing color
      // Disable random accessories (glasses) unless explicitly set
      accessoriesProbability: config.accessories ? 100 : 0,
    };
    
    // ALWAYS explicitly set expression options to preserve them
    // If not set, use defaults to prevent random changes
    avatarOptions.eyes = config.eyes && config.eyes !== 'default' ? [config.eyes] : ['default'];
    avatarOptions.mouth = config.mouth && config.mouth !== 'default' ? [config.mouth] : ['default'];
    avatarOptions.eyebrows = config.eyebrows && config.eyebrows !== 'default' ? [config.eyebrows] : ['default'];
    
    if (config.facialHair && config.facialHair !== 'Blank') {
      avatarOptions.facialHair = [config.facialHair];
      // Always provide facialHairColor when facialHair is set, default to hairColor if not specified
      avatarOptions.facialHairColor = [config.facialHairColor || config.hairColor || '2c1b18'];
      // Set facialHairProbability to 100 to ensure facial hair is displayed
      avatarOptions.facialHairProbability = 100;
    } else {
      // Explicitly disable facial hair if not set
      avatarOptions.facialHairProbability = 0;
    }
    
    // Only add accessories if explicitly set
    if (config.accessories && config.accessories !== 'Blank') {
      avatarOptions.accessories = [config.accessories];
    }
    
    const avatar = createAvatar(avataaars, avatarOptions);

      return avatar.toDataUri();
    } catch (error) {
      console.error('Error generating avatar:', error);
      return null;
    }
  }, [userId, name, size, savedPreferences, externalPreferences]);

  if (!avatarUrl) {
    return (
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: size * 0.4,
            fontFamily: 'Segoe UI, sans-serif',
          }}
        >
          {name.charAt(0)}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        background: 'white',
      }}
    >
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </Box>
  );
};

export default Avatar;

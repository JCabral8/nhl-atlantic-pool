import { useMemo, useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import axios from 'axios';

const Avatar = ({ userId, name, size = 120, preferences: externalPreferences }) => {
  const [savedPreferences, setSavedPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  // Default avatar config
  const defaultConfig = {
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
        const response = await axios.get(`http://localhost:3001/api/users/${userId}/avatar`, {
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

  const avatarUrl = useMemo(() => {
    if (!userId || !name) {
      return null;
    }

    // Use external preferences if provided, otherwise use saved, otherwise defaults
    const preferences = externalPreferences || savedPreferences;
    const config = preferences || defaultConfig[userId] || defaultConfig.nick;

    if (!config || !config.skinColor || !config.hairColor || !config.top) {
      return null;
    }

    try {
    const avatarOptions = {
      size: size,
      seed: `${name}-${userId}`,
      skinColor: [config.skinColor],
      hairColor: [config.hairColor],
      top: [config.top], // Always include top
    };
    
    // Add optional features
    if (config.eyes && config.eyes !== 'default') {
      avatarOptions.eyes = [config.eyes];
    }
    if (config.mouth && config.mouth !== 'default') {
      avatarOptions.mouth = [config.mouth];
    }
    if (config.eyebrows && config.eyebrows !== 'default') {
      avatarOptions.eyebrows = [config.eyebrows];
    }
    if (config.facialHair && config.facialHair !== 'Blank') {
      avatarOptions.facialHair = [config.facialHair];
      if (config.facialHairColor) {
        avatarOptions.facialHairColor = [config.facialHairColor];
      }
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

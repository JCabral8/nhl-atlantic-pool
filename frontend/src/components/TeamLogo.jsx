import { useState, memo } from 'react';

const TeamLogo = memo(({ teamData, className = '', size = '64px' }) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  if (!teamData) return null;

  const handleError = (e) => {
    if (!fallbackError && teamData.logoFallback) {
      // Try fallback logo
      setFallbackError(true);
      e.target.src = teamData.logoFallback;
    } else {
      // Use emoji as final fallback
      setImageError(true);
    }
  };

  if (imageError) {
    return (
      <div 
        className={`team-logo flex items-center justify-center ${className}`}
        style={{
          background: teamData.gradient,
          width: size,
          height: size,
        }}
      >
        <span className="text-2xl">{teamData.emoji}</span>
      </div>
    );
  }

  return (
    <div 
      className={`team-logo bg-white p-2 flex items-center justify-center ${className}`}
      style={{
        background: 'white',
        width: size,
        height: size,
      }}
    >
      <img 
        src={teamData.logo} 
        alt={teamData.name}
        className="w-full h-full object-contain"
        draggable="false"
        loading="lazy"
        onError={handleError}
      />
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

export default TeamLogo;


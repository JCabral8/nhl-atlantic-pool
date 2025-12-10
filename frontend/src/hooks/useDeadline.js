import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatTimeRemaining } from '../utils/timeUtils';

export const useDeadline = () => {
  const { deadline } = useApp();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [formattedTime, setFormattedTime] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!deadline) return;

    const updateTimer = () => {
      const deadlineDate = new Date(deadline.deadline);
      const now = new Date();
      const remaining = deadlineDate - now;
      
      setTimeRemaining(remaining);
      setFormattedTime(formatTimeRemaining(remaining));
      setIsActive(remaining > 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return {
    deadline: deadline?.deadline,
    timeRemaining,
    formattedTime,
    isActive,
  };
};


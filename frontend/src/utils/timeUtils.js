export const formatTimeRemaining = (milliseconds) => {
  if (milliseconds <= 0) return 'Deadline passed';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h remaining`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m remaining`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  }
  return `${seconds}s remaining`;
};

export const isDeadlinePassed = (deadlineStr) => {
  return new Date() > new Date(deadlineStr);
};


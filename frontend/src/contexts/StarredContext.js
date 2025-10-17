import React, { createContext, useContext, useState, useEffect } from 'react';

const StarredContext = createContext();

export const useStarred = () => {
  const context = useContext(StarredContext);
  if (!context) {
    throw new Error('useStarred must be used within a StarredProvider');
  }
  return context;
};

export const StarredProvider = ({ children }) => {
  const [starredVideos, setStarredVideos] = useState(() => {
    // Load starred videos from localStorage on initialization
    try {
      const saved = localStorage.getItem('starredVideos');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading starred videos from localStorage:', error);
      return [];
    }
  });

  // Save to localStorage whenever starred videos change
  useEffect(() => {
    try {
      localStorage.setItem('starredVideos', JSON.stringify(starredVideos));
    } catch (error) {
      console.error('Error saving starred videos to localStorage:', error);
    }
  }, [starredVideos]);

  const toggleStarred = (video) => {
    setStarredVideos(prev => {
      const isAlreadyStarred = prev.some(v => v.id === video.id);
      
      if (isAlreadyStarred) {
        // Remove from starred
        return prev.filter(v => v.id !== video.id);
      } else {
        // Add to starred
        return [...prev, video];
      }
    });
  };

  const isStarred = (videoId) => {
    return starredVideos.some(v => v.id === videoId);
  };

  const clearAllStarred = () => {
    setStarredVideos([]);
  };

  const value = {
    starredVideos,
    toggleStarred,
    isStarred,
    clearAllStarred
  };

  return (
    <StarredContext.Provider value={value}>
      {children}
    </StarredContext.Provider>
  );
};
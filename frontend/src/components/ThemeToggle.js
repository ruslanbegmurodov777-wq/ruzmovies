import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <div className={`toggle-slider ${isDarkMode ? 'dark' : 'light'}`}>
        <span className="toggle-icon sun-icon">☀️</span>
        <div className="toggle-circle">
          <span className="circle-icon">
            {isDarkMode ? '🌙' : '☀️'}
          </span>
        </div>
        <span className="toggle-icon moon-icon">🌙</span>
      </div>
    </button>
  );
};

export default ThemeToggle;
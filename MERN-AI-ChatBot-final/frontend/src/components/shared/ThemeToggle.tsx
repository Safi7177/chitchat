import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { IoMdSunny, IoMdMoon } from 'react-icons/io';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: isDarkMode ? '#ffd700' : '#1976d2',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(255, 215, 0, 0.1)' : 'rgba(25, 118, 210, 0.1)',
          },
        }}
      >
        {isDarkMode ? <IoMdSunny size={24} /> : <IoMdMoon size={24} />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;

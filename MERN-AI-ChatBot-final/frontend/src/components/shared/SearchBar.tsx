import React, { useState } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import { IoMdSearch, IoMdClose } from 'react-icons/io';
import { useTheme } from '../../context/ThemeContext';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search conversations..." }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode } = useTheme();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <Box sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? "#333" : "#ddd"}` }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: isDarkMode ? 'white' : 'black',
            '& fieldset': {
              borderColor: isDarkMode ? '#333' : '#ddd',
            },
            '&:hover fieldset': {
              borderColor: isDarkMode ? '#555' : '#999',
            },
            '&.Mui-focused fieldset': {
              borderColor: isDarkMode ? '#00fffc' : '#1976d2',
            },
          },
          '& .MuiInputBase-input': {
            color: isDarkMode ? 'white' : 'black',
            '&::placeholder': {
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IoMdSearch color={isDarkMode ? '#00fffc' : '#1976d2'} />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClear}
                size="small"
                sx={{ color: isDarkMode ? 'white' : 'black' }}
              >
                <IoMdClose />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;

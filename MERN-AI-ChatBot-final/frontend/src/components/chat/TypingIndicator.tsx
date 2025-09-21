import React from "react";
import { Box, Typography } from "@mui/material";
import { Avatar } from "@mui/material";
import { useTheme } from "../../context/ThemeContext";

const TypingIndicator = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <Box
      sx={{
        display: "flex",
        p: 2,
        bgcolor: isDarkMode ? "#004d5612" : "#f0f0f0",
        gap: 2,
        borderRadius: 2,
        my: 1,
        alignItems: "center",
      }}
    >
      <Avatar sx={{ ml: "0" }}>
        <img src="openai.png" alt="openai" width={"30px"} />
      </Avatar>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: "20px", color: isDarkMode ? "gray" : "#666" }}>
          AI is typing
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            "& > div": {
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: isDarkMode ? "#00fffc" : "#1976d2",
              animation: "typing 1.4s infinite ease-in-out",
              "&:nth-of-type(1)": { animationDelay: "0s" },
              "&:nth-of-type(2)": { animationDelay: "0.2s" },
              "&:nth-of-type(3)": { animationDelay: "0.4s" },
            },
            "@keyframes typing": {
              "0%, 60%, 100%": {
                transform: "translateY(0)",
                opacity: 0.4,
              },
              "30%": {
                transform: "translateY(-10px)",
                opacity: 1,
              },
            },
          }}
        >
          <div></div>
          <div></div>
          <div></div>
        </Box>
      </Box>
    </Box>
  );
};

export default TypingIndicator;

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
      }}
    >
      <Typography variant="h1" sx={{ color: "white", fontSize: "4rem" }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ color: "white" }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ color: "gray", textAlign: "center" }}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate("/")}
        sx={{
          mt: 2,
          bgcolor: "#00fffc",
          "&:hover": {
            bgcolor: "white",
            color: "black",
          },
        }}
      >
        Go Home
      </Button>
    </Box>
  );
};

export default NotFound;

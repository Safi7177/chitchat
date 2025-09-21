import Header from "./components/Header";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Footer from "./components/footer/Footer";
import { Box, CircularProgress } from "@mui/material";

function App() {
  const auth = useAuth();

  // Show loading spinner while auth state is being determined
  if (auth === null) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#05101c",
        }}
      >
        <CircularProgress sx={{ color: "#00fffc" }} />
      </Box>
    );
  }

  return (
    <ThemeProvider>
      <main>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/chat" 
            element={
              auth?.isLoggedIn && auth.user ? (
                <Chat />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </ThemeProvider>
  );
}

export default App;

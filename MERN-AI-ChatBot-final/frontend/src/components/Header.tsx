import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Logo from "./shared/Logo";
import { useAuth } from "../context/AuthContext";
import NavigationLink from "./shared/NavigationLink";
import ThemeToggle from "./shared/ThemeToggle";
import { useLocation } from "react-router-dom";

const Header = () => {
  const auth = useAuth();
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  
  return (
    <AppBar
      sx={{ bgcolor: "transparent", position: "static", boxShadow: "none" }}
    >
      <Toolbar sx={{ display: "flex" }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ThemeToggle />
          {auth?.isLoggedIn ? (
            <>
              {!isChatPage && (
                <NavigationLink
                  bg="#00fffc"
                  to="/chat"
                  text="Go To Chat"
                  textColor="black"
                />
              )}
              <NavigationLink
                bg="#51538f"
                textColor="white"
                to="/"
                text="logout"
                onClick={auth.logout}
              />
            </>
          ) : (
            <>
              <NavigationLink
                bg="#00fffc"
                to="/login"
                text="Login"
                textColor="black"
              />
              <NavigationLink
                bg="#51538f"
                textColor="white"
                to="/signup"
                text="Signup"
              />
            </>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

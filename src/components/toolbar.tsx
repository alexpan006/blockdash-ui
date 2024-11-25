import React from "react";
import { styled } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import SearchComponent from "./search"; // Ensure correct import path
import TitleComponent from "./title";
import Box from "@mui/material/Box";
import Link from "next/link";
import { useMediaQuery, useTheme } from "@mui/material";

// Define the toolbar container
const ToolbarContainer = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(0.25),
  minHeight: "48px", // Default minimum height for non-mobile
  [theme.breakpoints.down("sm")]: {
    minHeight: "64px", // Larger height on mobile screens
    padding: theme.spacing(1), // Increase padding on mobile to accommodate search component
  },
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(0.5),
  },
}));

// Filler box to extend the toolbar background when the drawer is closed
const FillerBox = styled(Box)(({ theme }) => ({
  width: "3vw", // Matches the sidebar width
  backgroundColor: theme.palette.primary.main, // Same background color as the toolbar
  height: "48px", // Match the toolbar height
  [theme.breakpoints.down("sm")]: {
    height: "64px", // Match toolbar height on mobile
  },
}));

const ToolbarComponent: React.FC<{
  onDrawerOpen: () => void;
  isDrawerOpen: boolean;
}> = ({ onDrawerOpen, isDrawerOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
      {!isDrawerOpen && <FillerBox />}{" "}
      {/* Render FillerBox only when drawer is closed */}
      <ToolbarContainer>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            justifyContent: "flex-start",
            gap: 1,
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onDrawerOpen}
            edge="start"
            sx={{
              mr: 1,
              p: isMobile ? 1 : 0.5, // Adjust padding based on screen size
              ...(isDrawerOpen && { display: "none" }), // Hide button if drawer is open
            }}
          >
            <MenuIcon />
          </IconButton>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <TitleComponent />
          </Link>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              ml: 1,
              maxWidth: isMobile ? "100%" : "200px", // Full width on mobile, fixed on larger screens
            }}
          >
            <SearchComponent />
          </Box>
        </Box>
      </ToolbarContainer>
    </Box>
  );
};

export default ToolbarComponent;

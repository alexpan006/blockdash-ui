"use client";

import React, { useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import ToolbarComponent from "@/components/toolbar";
import getConfig from "next/config";
import { getLogger } from "../../../util/logging/log-util";
import Head from "next/head";
import SidebarComponent from "@/components/sidebar";
import GiniBarChart from "@/components/ginibar";
import NakamotoBarChart from "@/components/nakamotobar";
import useMediaQuery from "@mui/material/useMediaQuery";
import Footer from "@/components/footer"; // Import the Footer component

const logger = getLogger("equality-measurement");

const { publicRuntimeConfig } = getConfig() || {};
const { API_URL } = publicRuntimeConfig || {};

const drawerWidth = "3vw";

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    marginLeft: 0,
  },
  [theme.breakpoints.up("md")]: {
    marginLeft: open ? `${drawerWidth}` : 0,
  },
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth})`,
    marginLeft: `${drawerWidth}`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    marginLeft: 0,
  },
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const EqualityMeasurement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const [open, setOpen] = useState(!isMobile); // Sidebar is open by default on larger screens, closed on mobile screens

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  logger.debug("This is a debug");
  logger.warn("This is a warning");

  return (
    <Box sx={{ display: "flex", flexGrow: 1 }}>
      <CssBaseline />
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <title>Equality Measurement</title>
      </Head>
      <AppBar position="fixed" open={open}>
        <ToolbarComponent onDrawerOpen={handleDrawerOpen} isDrawerOpen={open} />
      </AppBar>
      <SidebarComponent open={open} handleDrawerClose={handleDrawerClose} />
      <Main open={open}>
        <DrawerHeader />
        <Box
          sx={{
            flexGrow: 1,
            width: isMobile ? "100%" : "96%",
            height: "100%",
            margin: "0 auto",
            mt: isMobile ? 10 : theme.spacing(0), // Adjust margin-top based on screen size
            padding: isTablet ? theme.spacing(2) : theme.spacing(3),
            ml: isMobile ? 0 : "-5%", // Move content more to the left on non-mobile screens
            display: "flex",
            flexDirection: "column",
            alignItems: "center", // Center the charts horizontally
          }}
        >
          {/* Equality Measurement specific content */}
          <GiniBarChart />
          <NakamotoBarChart />
        </Box>
      </Main>

      <Footer />
    </Box>
  );
};

export default EqualityMeasurement;

async function getData() {
  const res = await fetch(API_URL || "http://localhost:3000/");
  if (!res.ok) {
    logger.error("This is an error message");
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

"use client"; // Mark this file as a client component
import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import ToolbarComponent from "@/components/toolbar";
import dynamic from "next/dynamic";
import getConfig from "next/config";
import { getLogger } from "../../util/logging/log-util";
import Head from "next/head";
import SidebarComponent from "@/components/sidebar";
import RankingTable from "@/components/rankingtable";
import useMediaQuery from "@mui/material/useMediaQuery";
import Footer from "@/components/footer"; // Import the Footer component

// Dynamically import the GraphTab component
const DynamicGraphTab = dynamic(() => import("@/components/graphtab"), {
  ssr: false,
});

const logger = getLogger("home");

const { publicRuntimeConfig } = getConfig() || {};
const { API_URL } = publicRuntimeConfig || {};

// Use a relative drawer width, such as 15% of the viewport width
const drawerWidth = "3vw";

// Main content area styling
const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  marginLeft: open ? drawerWidth : 0,
  width: open ? `calc(100% - ${drawerWidth})` : "100%",
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down("sm")]: {
    marginLeft: 0,
    width: "100%",
    padding: theme.spacing(1),
  },
  display: "flex",
  flexDirection: "column",
  alignItems: "center", // Center align items horizontally
  justifyContent: "flex-start", // Align items to the top vertically
  minHeight: "100vh",
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
    marginLeft: drawerWidth,
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
  padding: theme.spacing(1),
  justifyContent: "flex-end",
  height: "40px",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0.5),
    height: "35px",
  },
}));

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = React.useState(!isMobile); // Sidebar is closed by default on mobile

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  logger.debug("This is a debug");
  logger.warn("This is a warning");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppBar position="fixed" open={open}>
        <ToolbarComponent onDrawerOpen={handleDrawerOpen} isDrawerOpen={open} />
      </AppBar>
      <SidebarComponent open={open} handleDrawerClose={handleDrawerClose} />
      <Main open={open}>
        <DrawerHeader />
        <Box
          sx={{
            width: "100%",
            maxWidth: "1400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center", // Center align content vertically and horizontally
            gap: theme.spacing(4),
            flexGrow: 1,
            mt: isMobile ? 10 : theme.spacing(0), // Adjust margin-top based on screen size
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: open ? "96%" : "100%", // Adjust width based on sidebar state
              display: "flex",
              justifyContent: "center",
              marginTop: theme.spacing(4), // Add space between the toolbar and GraphTab
              alignItems: "center",
              transition: theme.transitions.create(["width"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            <DynamicGraphTab />
          </Box>
          <Box
            sx={{
              width: open ? "96%" : "100%", // Adjust width based on sidebar state
              maxWidth: "1450px", // Set a max-width to prevent it from becoming too wide
              display: "flex",
              justifyContent: "center",
              alignItems: "center", // Center the RankingTable vertically and horizontally
              transition: theme.transitions.create(["width"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            <RankingTable />
          </Box>
        </Box>
      </Main>
      <Box sx={{ marginTop: theme.spacing(8) }}>
        <Footer />
      </Box>
    </Box>
  );
};

export default Home;

async function getData() {
  const res = await fetch(API_URL || "http://localhost:3000/");
  if (!res.ok) {
    logger.error("This is an error message");
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

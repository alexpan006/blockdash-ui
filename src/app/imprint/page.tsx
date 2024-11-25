"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import ToolbarComponent from "@/components/toolbar";
import getConfig from "next/config";
import { getLogger } from "../../../util/logging/log-util";
import Head from "next/head";
import SidebarComponent from "@/components/sidebar";
import useMediaQuery from "@mui/material/useMediaQuery";
import Footer from "@/components/footer";
import Typography from "@mui/material/Typography";

const logger = getLogger("imprint-page");

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
    marginLeft: 0,
    padding: theme.spacing(2),
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

const ImprintPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = React.useState(false);

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
        <title>Imprint Page</title>
      </Head>
      <AppBar position="fixed" open={open}>
        <ToolbarComponent onDrawerOpen={handleDrawerOpen} isDrawerOpen={open} />
      </AppBar>
      <SidebarComponent open={open} handleDrawerClose={handleDrawerClose} />
      <Main open={open}>
        <DrawerHeader />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: "800px",
            width: "100%",
            margin: "0 auto",
            position: "relative",
            padding: { xs: 2, sm: 3, md: 4 },
            mt: isMobile ? 10 : theme.spacing(0), // Adjust margin-top based on screen size
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              textAlign: "center",
              marginBottom: { xs: "20px", sm: "25px", md: "30px" },
              width: "100%",
            }}
          >
            Imprint
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{
              textAlign: "justify",
              paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
              marginBottom: "40px",
            }}
          >
            This website is operated by the chair of Data Science in the
            Economic and Social Sciences, part of the Faculty of Business
            Administration of the University of Mannheim.
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{
              textAlign: "left",
              paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
              marginBottom: "40px",
              "&:before": {
                content: '"•"',
                display: "inline-block",
                marginRight: "8px",
              },
            }}
          >
            <strong>Name:</strong> NFTNets
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{
              textAlign: "left",
              paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
              marginBottom: "40px",
              "&:before": {
                content: '"•"',
                display: "inline-block",
                marginRight: "8px",
              },
            }}
          >
            <strong>Address:</strong> L 15 1-6, 68161 Mannheim, BW, Germany
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{
              textAlign: "left",
              paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
              marginBottom: "40px",
              "&:before": {
                content: '"•"',
                display: "inline-block",
                marginRight: "8px",
              },
            }}
          >
            <strong>Email:</strong>{" "}
            <a href="mailto:stefano.balietti@uni-mannheim.de">
              stefano.balietti@uni-mannheim.de
            </a>
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{
              textAlign: "left",
              paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
              marginBottom: "40px",
              "&:before": {
                content: '"•"',
                display: "inline-block",
                marginRight: "8px",
              },
            }}
          >
            <strong>Contact person:</strong> Dr. Stefano Balietti
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{
              textAlign: "left",
              paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
              marginBottom: "40px",
              "&:before": {
                content: '"•"',
                display: "inline-block",
                marginRight: "8px",
              },
            }}
          >
            <strong>Copyright:</strong> NFTNets
          </Typography>
        </Box>
      </Main>
      <Footer />
    </Box>
  );
};

export default ImprintPage;

async function getData() {
  const res = await fetch(API_URL || "http://localhost:3000/");
  if (!res.ok) {
    logger.error("This is an error message");
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
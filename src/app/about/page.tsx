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
import Grid from "@mui/material/Grid";

const logger = getLogger("about-page");

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
  minHeight: `calc(100vh - ${theme.spacing(8)}px)`, // Ensure minimum height to account for footer
  paddingBottom: theme.spacing(15), // Increase padding bottom to ensure text is not hidden by footer
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

const AboutPage: React.FC = () => {
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
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <title>About Page</title>
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
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "800px",
            width: "100%",
            margin: "0 auto",
            position: "relative",
            padding: { xs: 2, sm: 3, md: 4 },
            mt: isMobile ? 10 : theme.spacing(0), // Adjust margin-top based on screen size
            pb: theme.spacing(10), // Add padding bottom to prevent footer overlap
            [theme.breakpoints.down("sm")]: {
              pb: theme.spacing(20), // Add more padding bottom on mobile screens to ensure no content is hidden
            },
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              textAlign: "center",
              marginBottom: { xs: "10px", sm: "15px", md: "20px" },
            }}
          >
            About
          </Typography>
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <Typography
                variant="body1"
                paragraph
                sx={{
                  textAlign: "justify",
                  paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
                  margin: { xs: "10px 0", sm: "15px 0", md: "20px 0" }, // Margin for spacing
                }}
              >
                We are Ling Chen, Maximilian Heilmann, Omkar Kadam, Valentin
                Leuthe and Kai-Yan Pan. We are master students in business
                informatics and data science at the University of Mannheim.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="body1"
                paragraph
                sx={{
                  textAlign: "justify",
                  paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
                  margin: { xs: "10px 0", sm: "15px 0", md: "20px 0" }, // Margin for spacing
                }}
              >
                With NFTNets, we want to provide insights into different NFT
                collections and allow users to explore activities in those
                collections. For the scope of the project, we have focused on
                the NFT collections “Bored Apes Yacht Club” and “DeGods”, but
                other NFT collections may be included in the future.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="body1"
                paragraph
                sx={{
                  textAlign: "justify",
                  paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
                  margin: { xs: "10px 0", sm: "15px 0", md: "20px 0" }, // Margin for spacing
                }}
              >
                We implemented the website as part of the Master Team Project
                course of the Business Informatics Master at University of
                Mannheim, at the chair of Data Science in the Economic and
                Social Science. The project was supervised by Dr. Stefano
                Balietti, to whom we would like to say a very special thank you.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="body1"
                paragraph
                sx={{
                  textAlign: "justify",
                  paddingLeft: { xs: "10px", sm: "15px", md: "20px" },
                  margin: { xs: "10px 0", sm: "15px 0", md: "20px 0" }, // Margin for spacing
                }}
              >
                We started the project at the beginning of the spring semester
                2024 (Feb. 2024), the final submission was at the beginning of
                the Fall semester 2024 (End of Aug. 2024).
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Main>
      <Footer />
    </Box>
  );
};

export default AboutPage;

async function getData() {
  const res = await fetch(API_URL || "http://localhost:3000/");
  if (!res.ok) {
    logger.error("This is an error message");
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
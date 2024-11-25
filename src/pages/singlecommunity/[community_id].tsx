"use client";
import React, { useEffect, useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import ToolbarComponent from "@/components/toolbar";
import SidebarComponent from "@/components/sidebar";
import SingleGraph from "@/components/singlegraph";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/router";
import CircularProgress from "@mui/material/CircularProgress";
import Head from "next/head";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";

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

const CommunityGraph = () => {
  const router = useRouter();
  const { query } = router;
  const community_id = query.community_id as string;
  const scope = query.scope as string;
  const collection = query.collection as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState<number>(100);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const fetchData = async (fetchLimit: number) => {
    try {
      if (!community_id || !scope || !collection) {
        throw new Error("Missing required query parameters");
      }

      setLoading(true);
      setError(null); // Reset error before fetching
      console.log(`Fetching data with limit ${fetchLimit}...`);
      const endpoint = `/api/singlegraph?community_id=${community_id}&scope=${scope}&collection=${collection}&limit=${fetchLimit}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Fetched data:", result);
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      `community_id: ${community_id}, scope: ${scope}, collection: ${collection}`
    );
    if (community_id && scope && collection) {
      fetchData(limit);
    }
  }, [community_id, scope, collection, limit]);

  const handleUpdateClick = () => {
    fetchData(limit);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <CssBaseline />
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <AppBar position="fixed" open={open}>
          <ToolbarComponent
            onDrawerOpen={handleDrawerOpen}
            isDrawerOpen={open}
          />
        </AppBar>
        <SidebarComponent open={open} handleDrawerClose={handleDrawerClose} />
        <Main open={open}>
          <DrawerHeader />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={80} />
          </Box>
        </Main>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <CssBaseline />
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <AppBar position="fixed" open={open}>
          <ToolbarComponent
            onDrawerOpen={handleDrawerOpen}
            isDrawerOpen={open}
          />
        </AppBar>
        <SidebarComponent open={open} handleDrawerClose={handleDrawerClose} />
        <Main open={open}>
          <DrawerHeader />
          <Typography variant="body1">Error: {error}</Typography>
        </Main>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexGrow: 1, flexDirection: "column" }}>
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
            flexGrow: 1,
            width: isMobile ? "100%" : "96%", // Adjust width based on screen size

            height: "100%",
            margin: isMobile ? "0" : "0 auto", // Adjust margin for mobile screens
            mt: isMobile ? 10 : theme.spacing(3), // Adjust margin-top based on screen size
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            overflowY: "auto", // Handle overflow for content on smaller screens
            alignItems: "center",
            gap: theme.spacing(2),
          }}
        >
          {data && (
            <Box
              sx={{
                width: isMobile ? "100%" : "96%", // Increase the width for larger screens

                alignItems: "center",
                display: "flex",
                justifyContent: "center", // Center the content inside the Box
                margin: "0 auto", // Center the Box itself within the parent container
              }}
            >
              <SingleGraph
                data={data}
                fetchData={fetchData}
                limit={limit}
                setLimit={setLimit}
              />
            </Box>
          )}
        </Box>
      </Main>
    </Box>
  );
};

export default CommunityGraph;

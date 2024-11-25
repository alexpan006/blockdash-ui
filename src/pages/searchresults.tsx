"use client";

import React, { useEffect, useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import ToolbarComponent from "@/components/toolbar";
import SidebarComponent from "@/components/sidebar";
import SearchGraph from "@/components/searchgraph";
import Typography from "@mui/material/Typography";
import { useSearchParams } from "next/navigation";
import Head from "next/head";
import ErrorBoundary from "@/components/errorboundary"; // Import the ErrorBoundary component
import useMediaQuery from "@mui/material/useMediaQuery"; // Import useMediaQuery for responsiveness

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
    marginLeft: `-${drawerWidth}`,  
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

const SearchResultsPage = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Detect if the screen is mobile-sized

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!searchParams) return;

      const searchType = searchParams.get("searchType");
      const query = searchParams.get("query");
      const collection = searchParams.get("collection");

      if (!searchType || !query) {
        setLoading(false);
        return;
      }

      let url = "";
      if (searchType.toLowerCase() === "account") {
        url = `/api/search/address?address=${query}`;
      } else if (searchType.toLowerCase() === "nft" && collection) {
        url = `/api/search/nft?nft=${query}&collection=${collection}`;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  if (!searchParams) {
    return (
      <Typography variant="body1">No search parameters provided</Typography>
    );
  }

  const searchType = searchParams.get("searchType") ?? "Unknown";
  const query = searchParams.get("query") ?? "Unknown";
  let collection = searchParams.get("collection") ?? "Unknown";

  if (collection.toLowerCase() === "boredapeyachtclub") {
    collection = "BoredApes";
  } else if (collection.toLowerCase() === "degods-eth") {
    collection = "DeGods";
  }

  return (
    <Box sx={{ display: "flex", flexGrow: 1, flexDirection: "column", height: "100vh" }}>
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
            width: isMobile ? "100%" : "90%", // Adjust width based on screen size
            height: "100%",
            margin: isMobile ? "0" : "0 auto", // Adjust margin for mobile screens
            mt: isMobile ? 10 : theme.spacing(0), // Adjust margin-top based on screen size
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            overflowY: "auto", // Handle overflow for content on smaller screens
          }}
        >
          {loading ? (
            <Typography variant="body1">Loading...</Typography>
          ) : data ? (
            <div>
              <Typography variant="h6">Search Result:</Typography>
              <Typography variant="body1">Search Type: {searchType}</Typography>
              <Typography variant="body1">
                {searchType === "Account" ? "Address" : "Identifier"}: {query}
              </Typography>
              {searchType.toLowerCase() === "nft" && (
                <Typography variant="body1">
                  Collection: {collection}
                </Typography>
              )}
              <Box sx={{ marginTop: 2 }}>
                <ErrorBoundary>
                  <SearchGraph data={data} />
                </ErrorBoundary>
              </Box>
            </div>
          ) : (
            <Typography variant="body1">
              Search Result: Not Found
              <br />
              Search Type: {searchType}
              <br />
              {searchType === "Account" ? "Address" : "Identifier"}: {query}
              {searchType.toLowerCase() === "nft" && (
                <>
                  <br />
                  Collection: {collection}
                </>
              )}
            </Typography>
          )}
        </Box>
      </Main>
    </Box>
  );
};

export default SearchResultsPage;

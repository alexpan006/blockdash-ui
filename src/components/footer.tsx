import React, { useEffect, useState } from "react";
import { Box, Typography, Link, useTheme, useMediaQuery } from "@mui/material";

const Footer: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState<string>("Loading...");
  const [nextUpdate, setNextUpdate] = useState<string>("Loading")
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data from /api/dataupdate");

        const response = await fetch("/api/dataupdate", { next: { revalidate: 0 } });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        if (data.lastUpdateAt) {
          setLastUpdate(data.lastUpdateAt);
          setNextUpdate(data.nextUpdateAt);
        } else {
          setLastUpdate("Data not available");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLastUpdate("Error fetching data");
        setNextUpdate("Error fetching data");
      }
    };

    fetchData();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "white",
        color: "black",
        padding: isMobile ? "8px 10px" : "10px 20px",
        position: "fixed",
        bottom: 0,
        left: 0,
        display: "flex",
        justifyContent: "center", // Always center the content
        alignItems: "center",
        flexDirection: isMobile ? "column" : "row", // Stack items on mobile
        zIndex: 1000, // Ensures it stays on top
        textAlign: "center", // Center text
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 1 : 2, // Add spacing between items
        }}
      >
        <Typography variant="body2">
          <Link
            href="/imprint"
            sx={{
              color: "black",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Imprint
          </Link>
          {" | "}
          <Link
            href="/about"
            sx={{
              color: "black",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            About
          </Link>
        </Typography>
        <Typography variant="body2" sx={{ color: "black" }}>
          Last data update: {lastUpdate} UTC
        </Typography>
        <Typography variant="body2" sx={{ color: "black" }}>
          Next data update: {nextUpdate} UTC
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;

import React from "react";
import Typography from "@mui/material/Typography";
import { useTheme, useMediaQuery } from "@mui/material";

export default function TitleComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Typography
      variant={
        isMobile ? "h6" : isTablet ? "h5" : "h4"
      } // Different variants based on screen size
      noWrap
      component="div"
      sx={{
        textAlign: isMobile ? "center" : "left",
        padding: isMobile
          ? theme.spacing(1)
          : isTablet
          ? theme.spacing(1.5)
          : theme.spacing(2), // Adjusts padding based on screen size
        fontSize: isMobile
          ? "1.25rem"
          : isTablet
          ? "1.5rem"
          : "2rem", // Adjusts the font size
      }}
    >
      NFTNets
    </Typography>
  );
}

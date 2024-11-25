import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Link from "next/link";
import { Tooltip, useMediaQuery, Typography } from "@mui/material";
import HubIcon from "@mui/icons-material/Hub";
import TimelineIcon from "@mui/icons-material/Timeline";
import BalanceIcon from "@mui/icons-material/Balance";
import LinkIcon from "@mui/icons-material/Link";



const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "center",
}));

interface SidebarComponentProps {
  open: boolean;
  handleDrawerClose: () => void;
}

export default function SidebarComponent({
  open,
  handleDrawerClose,
}: SidebarComponentProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // Function to handle link click
  const handleLinkClick = () => {
    if (isMobile) {
      handleDrawerClose();
    }
  };

  return (
    <Drawer
      sx={{
        width: isMobile ? "100%" : isTablet ? "20vw" : "3vw", // Set relative width values
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: isMobile ? "100%" : isTablet ? "20vw" : "3vw", // Match paper width to drawer
          boxSizing: "border-box",
        },
      }}
      variant={isMobile ? "temporary" : "persistent"}
      anchor="left"
      open={open}
      onClose={isMobile ? handleDrawerClose : undefined}
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === "ltr" ? (
            <ChevronLeftIcon />
          ) : (
            <ChevronRightIcon />
          )}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        <Tooltip title="Network Analysis" placement="right">
          <ListItem
            button
            component={Link}
            href="/"
            onClick={handleLinkClick} // Close the drawer when clicked
            sx={{
              borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              height: isMobile ? 56 : isTablet ? 48 : 43,
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Center the icon in the list item
            }}
          >
            <HubIcon />
            {isMobile && (
              <Typography sx={{ marginLeft: 1 }}>Network Analysis</Typography>
            )}
          </ListItem>
        </Tooltip>
        <Tooltip title="Temporal Analysis" placement="right">
          <ListItem
            button
            component={Link}
            href="/temporal-analysis"
            onClick={handleLinkClick} // Close the drawer when clicked
            sx={{
              borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              height: isMobile ? 56 : isTablet ? 48 : 43,
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Center the icon in the list item
            }}
          >
            <TimelineIcon />
            {isMobile && (
              <Typography sx={{ marginLeft: 1 }}>Temporal Analysis</Typography>
            )}
          </ListItem>
        </Tooltip>
        <Tooltip title="Equality Measurement" placement="right">
          <ListItem
            button
            component={Link}
            href="/equality-measurement"
            onClick={handleLinkClick} // Close the drawer when clicked
            sx={{
              borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              height: isMobile ? 56 : isTablet ? 48 : 43,
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Center the icon in the list item
            }}
          >
            <BalanceIcon />
            {isMobile && (
              <Typography sx={{ marginLeft: 1 }}>
                Equality Measurement
              </Typography>
            )}
          </ListItem>
        </Tooltip>
        <Divider />
        <Tooltip title="Etherscan" placement="right">
          <ListItem
            button
            component={Link}
            href="https://etherscan.io/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick} // Close the drawer when clicked
            sx={{
              borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              height: isMobile ? 56 : isTablet ? 48 : 43,
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Center the icon in the list item
            }}
          >
            <LinkIcon />
            {isMobile && (
              <Typography sx={{ marginLeft: 1 }}>Etherscan</Typography>
            )}
          </ListItem>
        </Tooltip>
        <Tooltip title="Opensea" placement="right">
          <ListItem
            button
            component={Link}
            href="https://opensea.io"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick} // Close the drawer when clicked
            sx={{
              borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              height: isMobile ? 56 : isTablet ? 48 : 43,
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Center the icon in the list item
            }}
          >
            <LinkIcon />
            {isMobile && (
              <Typography sx={{ marginLeft: 1 }}>Opensea</Typography>
            )}
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
}

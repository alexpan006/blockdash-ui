import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import SummaryGraph from "./summarygraph";
import CentralityGraph from "./centralitygraph";

const GraphTab: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<number>(0);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        sx={{
          position: "absolute",
          top: { xs: 5, sm: 10 },
          left: { xs: 5, sm: 10 },
          zIndex: 1,
          minWidth: { xs: "120px", sm: "200px" },
          ".MuiTab-root": {
            padding: { xs: "8px 12px", sm: "12px 16px" },
            minWidth: { xs: "100px", sm: "160px" },
            fontSize: { xs: "0.8rem", sm: "1rem" },
          },
        }}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
      >
        <Tab label="Community Detection" />
        <Tab label="Degree Centrality" />
      </Tabs>
      <Box
        sx={{
          marginTop: { xs: 7, sm: 10 },
          height: "calc(100% - 50px)", // Adjust to ensure space for tabs
          overflow: "auto",
        }}
      >
        {selectedTab === 0 && <SummaryGraph />}
        {selectedTab === 1 && <CentralityGraph />}
      </Box>
    </Box>
  );
};

export default GraphTab;

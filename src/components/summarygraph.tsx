import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import cytoscape, { ElementDefinition, Core, EventObject } from "cytoscape";
import {
  Box,
  CircularProgress,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Card,
  CardContent,
  Tooltip,
  useMediaQuery,
  useTheme,
  Drawer,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";

import * as d3 from "d3-scale";
import * as d3Chromatic from "d3-scale-chromatic";
import { getLogger } from "../../util/logging/log-util";

import { styled, Theme } from "@mui/material/styles";

import GraphTab from "./graphtab"; // Assuming GraphTab is introduced to handle tab selection and rendering

const logger = getLogger("SummaryGraph");

interface Community {
  community_id: number;
  size: number;
  nft_share_degods?: number;
  nft_share_boredapes?: number;
}

interface Relationship {
  start_node: number;
  end_node: number;
  count: number;
}

interface Data {
  communities: Community[];
  relationships: Relationship[];
}

const ControlContainer = styled("div")({
  position: "absolute",
  bottom: "2%",
  left: "1%",
  display: "flex",
  flexDirection: "row",
  gap: "1%",
  zIndex: 1000,
  backgroundColor: "white",
  padding: "1%",
  borderRadius: "5px",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  "@media (max-width: 600px)": {
    flexDirection: "column",
    bottom: "2%",
    left: "2%",
  },
});

const ClusterPanel = styled("div")(({ theme }: { theme: Theme }) => ({
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 1,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  maxHeight: "70vh",
  overflowY: "auto",
  width: "300px", // Fixed width in pixels
  [theme.breakpoints.down("sm")]: {
    width: "90vw",
    top: 10,
    left: "5%",
    transform: "translateX(-5%)",
  },
}));

const ColorBox = styled("div")(({ color }: { color: string }) => ({
  width: 16,
  height: 16,
  backgroundColor: color,
  display: "inline-block",
  marginRight: 8,
  borderRadius: 2,
}));

const StickyHeader = styled("div")({
  position: "sticky",
  top: 0,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  zIndex: 2,
});

const generateColor = (index: number) => {
  const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];
  return colors[index % colors.length];
};

const getColorScale = (value: number, maxCount: number) => {
  const scale = d3
    .scaleSequential(d3Chromatic.interpolateYlGnBu)
    .domain([0, maxCount]);
  return scale(value);
};

const SummaryGraph: React.FC = () => {
  const router = useRouter();
  const cyRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [scope, setScope] = useState<string>("ownership");
  const [collections, setCollections] = useState<string[]>(["degods", "boredapes"]);
  const [formScope, setFormScope] = useState<string>("ownership");
  const [formCollections, setFormCollections] = useState<string[]>(["degods", "boredapes"]);

  const [selectedCommunities, setSelectedCommunities] = useState<Set<number>>(
    new Set()
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(true);
  const cyInstance = useRef<Core | null>(null);
  const [communityColors, setCommunityColors] = useState<{
    [key: number]: string;
  }>({});
  const [hoveredNode, setHoveredNode] = useState<Community | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [isClusterPanelOpen, setClusterPanelOpen] = useState<boolean>(
    !isMobile
  );
  const [isScopePanelOpen, setScopePanelOpen] = useState<boolean>(!isMobile);
  const [isLegendOpen, setLegendOpen] = useState<boolean>(!isMobile);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationFrameId = useRef<number | null>(null); // Correctly declared useRef

  const toggleClusterPanelDrawer = () => {
    setClusterPanelOpen((prev) => !prev);
  };

  const toggleScopePanelDrawer = () => {
    setScopePanelOpen((prev) => !prev);
  };

  const toggleLegendDrawer = () => {
    setLegendOpen((prev) => !prev);
  };

  const fetchData = useCallback(
    async (scope: string, collections: string[]) => {
      setLoading(true);
      setError(null);
      try {
        const collectionParams = collections
          .map((c) => `collection=${c}`)
          .join("&");
        const query = `/api/summarygraph?limit=10&scope=${scope}&${collectionParams}`;
        console.log("Fetching data with query:", query);
        const response = await fetch(query);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: Data = await response.json();
        console.log("API Response:", JSON.stringify(result, null, 2));
        logger.debug("Fetched data:", result);
        setData(result);
        setScope(scope);
        setCollections(collections);

        const colors: { [key: number]: string } = {};
        result.communities.forEach((community, index) => {
          colors[community.community_id] = generateColor(index);
        });
        setCommunityColors(colors);
        setSelectedCommunities(
          new Set(result.communities.map((c) => c.community_id))
        );
      } catch (error) {
        logger.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isFullscreen) {
      setClusterPanelOpen(false);
      setScopePanelOpen(false);
      setLegendOpen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    fetchData("ownership", ["degods", "boredapes"]);
  }, [fetchData]);

  const initializeCy = useCallback(() => {
    if (!cyRef.current || !data) return;

    const sortedCommunities = [...data.communities].sort(
      (a, b) => b.size - a.size
    );

    const nodes: ElementDefinition[] = sortedCommunities
      .filter((community) => selectedCommunities.has(community.community_id))
      .map((community, index) => {
        const degodsShare = community.nft_share_degods || 0;
        const boredapesShare = community.nft_share_boredapes || 0;
        const otherShare = 1 - degodsShare - boredapesShare;

        const pie_sizes = [
          degodsShare * 100,
          boredapesShare * 100,
          otherShare * 100,
        ];

        const nodeData = {
          id: community.community_id.toString(),
          label: (
            sortedCommunities.findIndex(
              (c) => c.community_id === community.community_id
            ) + 1
          ).toString(),
          size: community.size,
          color:
            communityColors[community.community_id] || generateColor(index),
          pie_sizes: pie_sizes,
          pie_colors: ["#00008b", "#ffa500", "#ffffff"],
          nft_share_degods: community.nft_share_degods,
          nft_share_boredapes: community.nft_share_boredapes,
        };

        return { data: nodeData };
      });

    const maxCount = Math.max(...data.relationships.map((r) => r.count));
    const edges: ElementDefinition[] = data.relationships
      .filter(
        (relationship) =>
          selectedCommunities.has(relationship.start_node) &&
          selectedCommunities.has(relationship.end_node)
      )
      .map((relationship: Relationship) => ({
        data: {
          id: `edge-${relationship.start_node}-${relationship.end_node}`,
          source: relationship.start_node.toString(),
          target: relationship.end_node.toString(),
          count: relationship.count,
          color: getColorScale(relationship.count, maxCount),
        },
      }));

    const elements: ElementDefinition[] = [...nodes, ...edges];

    const cy = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            width: (ele: any) => 10 + Math.log(ele.data("size")) * 10,
            height: (ele: any) => 10 + Math.log(ele.data("size")) * 10,
            "background-color": (ele: any) => {
              if (
                (scope === "ownership" || scope === "all") &&
                collections.length > 1
              ) {
                return "transparent";
              }
              return ele.data("color");
            },
            ...((scope === "ownership" || scope === "all") &&
            collections.length > 1
              ? {
                  "pie-size": "80%",
                  "pie-1-background-color": (ele: any) =>
                    ele.data("pie_colors")[0],
                  "pie-1-background-size": (ele: any) =>
                    `${ele.data("pie_sizes")[0]}%`,
                  "pie-2-background-color": (ele: any) =>
                    ele.data("pie_colors")[1],
                  "pie-2-background-size": (ele: any) =>
                    `${ele.data("pie_sizes")[1]}%`,
                  "pie-3-background-color": (ele: any) =>
                    ele.data("pie_colors")[2],
                  "pie-3-background-size": (ele: any) =>
                    `${ele.data("pie_sizes")[2]}%`,
                  "border-width": 10,
                  "border-color": (ele: any) => ele.data("color"),
                }
              : {}),
            cursor: "pointer",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": isMobile ? "10px" : "14px",
            color: "#fff",
            "text-outline-width": 2,
            "text-outline-color": "#000",
          },
        },

        {
          selector: "edge",
          style: {
            width: (ele: any) => Math.max(0, Math.log(ele.data("count"))),
            "line-color": "data(color)",
            "target-arrow-color": "data(color)",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "",
            "text-background-color": "#fff",
            "text-background-opacity": 0.7,
            "font-size": isMobile ? "8px" : "10px",
            color: "#000",
          },
        },
        {
          selector: "edge.hover",
          style: {
            "line-color": "red",
            "target-arrow-color": "red",
            "z-index": 9999,
            label: "data(count)",
            "font-size": "24px",
            color: "red",
          },
        },
      ],
      layout: {
        name: "circle",
        radius: 300, // Increase the radius for a larger initial graph
        startAngle: (3 / 2) * Math.PI,
        padding: 100, // Add padding for better spacing
        avoidOverlap: true, // Prevent nodes from overlapping
      },
    });

    cyInstance.current = cy;

    // Run the layout
    cy.layout({
      name: "circle",
      radius: 300,
      startAngle: (3 / 2) * Math.PI,
      padding: 100,
      avoidOverlap: true,
    }).run();
    // Center and fit the graph after the layout is applied
    cy.fit(cy.nodes());
    cy.center();

    const handleNodeClick = (event: EventObject) => {
      const target = event.target as cytoscape.NodeSingular;
      const communityId = target.data("id");
      const collectionQuery = collections.join(",");
      router.push(
        `/singlecommunity/${communityId}?scope=${scope}&collection=${collectionQuery}`
      );
    };

    const handleNodeMouseOver = (event: cytoscape.EventObject) => {
      const target = event.target as cytoscape.NodeSingular;

      target.addClass("hover");
      (cy.container() as HTMLElement).style.cursor = "pointer";

      const nodeData = target.data();
      setHoveredNode({
        community_id: parseInt(nodeData.id, 10),
        size: nodeData.size,
        nft_share_degods: nodeData.nft_share_degods,
        nft_share_boredapes: nodeData.nft_share_boredapes,
      });

      const renderedPosition = target.position();
      const containerRect = (
        cy.container() as HTMLElement
      ).getBoundingClientRect();
      setHoverPosition({
        x: renderedPosition.x + containerRect.left,
        y: renderedPosition.y + containerRect.top,
      });
    };

    const handleEdgeMouseOver = (event: cytoscape.EventObject) => {
      const target = event.target as cytoscape.EdgeSingular;
      target.addClass("hover");
      target.data("label", target.data("count").toString());
    };

    const handleEdgeMouseOut = (event: cytoscape.EventObject) => {
      const target = event.target as cytoscape.EdgeSingular;
      target.removeClass("hover");
      target.data("label", "");
    };

    const handleNodeMouseOut = (event: cytoscape.EventObject) => {
      const target = event.target as cytoscape.NodeSingular;
      target.removeClass("hover");
      (cy.container() as HTMLElement).style.cursor = "default";

      setHoveredNode(null);
      setHoverPosition(null);
    };

    cy.on("tap", "node", handleNodeClick);
    cy.on("mouseover", "node", (event) => {
      handleNodeMouseOver(event as cytoscape.EventObject);
    });

    cy.on("mouseover", "edge", (event) => {
      handleEdgeMouseOver(event as cytoscape.EventObject);
    });

    cy.on("mouseout", "node", (event) => {
      handleNodeMouseOut(event as cytoscape.EventObject);
    });

    cy.on("mouseout", "edge", (event) => {
      handleEdgeMouseOut(event as cytoscape.EventObject);
    });

    // Start node floating animation
    if (isAnimating) {
      floatNodes();
    }
  }, [
    data,
    selectedCommunities,
    communityColors,
    scope,
    collections,
    isMobile,
    isAnimating,
  ]);

  const floatNodes = useCallback(() => {
    if (!cyInstance.current) return;

    const nodes = cyInstance.current.nodes();

    nodes.forEach((node: cytoscape.NodeSingular) => {
      const startTime = performance.now();
      const direction = {
        x: Math.random() > 0.5 ? 1 : -1,
        y: Math.random() > 0.5 ? 1 : -1,
      };
      const phase = Math.random() * Math.PI * 2;
      animateNode(node, startTime, direction, phase);
    });
  }, []);

  const animateNode = (
    node: cytoscape.NodeSingular,
    startTime: number,
    direction: { x: number; y: number },
    phase: number
  ) => {
    const animate = (timestamp: number) => {
      if (!isAnimating || !cyInstance.current) {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        return;
      }

      const elapsedTime = timestamp - startTime;
      const progress = (elapsedTime % 10000) / 10000; // Animation duration is 10 seconds
      const xOffset =
        0.2 * Math.sin(progress * Math.PI * 2 + phase) * direction.x;
      const yOffset =
        0.2 * Math.sin(progress * Math.PI * 2 + phase) * direction.y;
      const currentSizeChange = 5 * Math.sin(progress * Math.PI * 2 + phase);

      const currentPosition = node.position();

      node.position({
        x: currentPosition.x + xOffset,
        y: currentPosition.y + yOffset,
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);
  };

  const handleAnimationToggle = () => {
    setIsAnimating((prev) => {
      if (!prev && cyInstance.current) {
        floatNodes(); // Start the animation again when toggled back on
      }
      return !prev;
    });
  };

  useEffect(() => {
    if (isAnimating) {
      floatNodes();
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isAnimating, floatNodes]);

  useEffect(() => {
    initializeCy();

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, [
    data,
    selectedCommunities,
    communityColors,
    selectedTab,
    scope,
    collections,
    initializeCy,
  ]);

  const handleScopeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormScope(event.target.value);
  };

  const handleCollectionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const collection = event.target.name;
    setFormCollections((prevCollections) =>
      event.target.checked
        ? [...prevCollections, collection]
        : prevCollections.filter((c) => c !== collection)
    );
  };

  const handleZoomIn = () => {
    if (cyInstance.current) {
      cyInstance.current.zoom(cyInstance.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyInstance.current) {
      cyInstance.current.zoom(cyInstance.current.zoom() * 0.8);
    }
  };

  const handleResetZoom = () => {
    if (cyInstance.current) {
      cyInstance.current.fit();
    }
  };

  const handleCenter = () => {
    if (cyInstance.current) {
      cyInstance.current.center();
    }
  };

  const handleFullscreen = () => {
    if (!isMobile) {
      // Prevent fullscreen on mobile
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
        setClusterPanelOpen(false); // Close other panels when entering fullscreen
        setScopePanelOpen(false);
        setLegendOpen(false);
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
        setClusterPanelOpen(false); // Ensure toggles are closed by default on mobile
        setScopePanelOpen(false);
        setLegendOpen(false);
      }
    }
  };

  const handleCommunityChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const communityId = parseInt(event.target.name, 10);
    setSelectedCommunities((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (event.target.checked) {
        newSelected.add(communityId);
      } else {
        newSelected.delete(communityId);
      }
      return newSelected;
    });
  };

  const handleCheckAll = () => {
    if (data) {
      setSelectedCommunities(
        new Set(data.communities.map((c) => c.community_id))
      );
    }
  };

  const handleUncheckAll = () => {
    setSelectedCommunities(new Set());
  };

  const handleUpdateGraph = () => {
    fetchData(formScope, formCollections);
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Typography variant="h6">Error: {error}</Typography>
      </Box>
    );
  }

  const maxCount = Math.max(...(data?.relationships.map((r) => r.count) || []));
  const sortedCommunities = [...(data?.communities || [])].sort(
    (a, b) => b.size - a.size
  );

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        height: isMobile ? "100vh" : "70vh",
        backgroundColor: isFullscreen ? "white" : "inherit",
        overflow: isFullscreen ? "hidden" : "auto",
        zIndex: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Button
        variant="contained"
        onClick={handleAnimationToggle}
        style={{ position: "absolute", bottom: "2%", left: "25%", zIndex: 10 }}
      >
        {isAnimating ? "Stop Animation" : "Start Animation"}
      </Button>

      {selectedTab === 0 && (
        <>
          {!isMobile && (
            <>
              <ClusterPanel theme={theme} sx={{ zIndex: 1001 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body1">
                    Top 10 Communities ({selectedCommunities.size}/
                    {data?.communities.length})
                  </Typography>
                  <Tooltip
                    title={
                      <Box sx={{ textAlign: "justify" }}>
                        <Typography variant="body2">
                          This is a summary of the largest communities
                          calculated with the selected scope on the selected NFT
                          collections. Each node represents a community and
                          indicates its size based on the number of NFT and
                          owners included. Edges between nodes visualize the
                          number of relationships (transactions, ownerships, and
                          mint events) between two communities. It is the sum of
                          relationships between NFT and/or Owners that are
                          clustered in these two considered communities.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Example:</strong>
                          <br />
                          • If we have community gray and community pink and a
                          directed relation from gray to pink (to keep it
                          simple, we assume the relation has count 1). It means
                          that an Owner that was clustered in the gray community
                          transacted once with an Owner that is clustered in the
                          pink community.
                          <br />• If we assume there are 2 relationships: it
                          means that 2 transactions took place between Owners of
                          the gray community with Owners in the pink community
                          (this could be 2 transactions between the same two
                          Owners or between different owners).
                          <br />• If we consider the transaction scope and have
                          community gray and community pink and a relation from
                          gray to pink (to see it simple, we assume the relation
                          has count 1).
                        </Typography>
                      </Box>
                    }
                    placement="right"
                  >
                    <InfoIcon sx={{ ml: 1, cursor: "pointer" }} />
                  </Tooltip>
                  <IconButton
                    onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                  >
                    {isPanelExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                {isPanelExpanded && (
                  <>
                    <Table>
                      <TableHead>
                        <TableRow
                          sx={{
                            height: "10px",
                          }}
                        >
                          <TableCell
                            sx={{
                              width: "120px",
                              textAlign: "left",
                              paddingLeft: "8px",
                            }}
                          >
                            <Button
                              onClick={() => {
                                if (
                                  selectedCommunities.size ===
                                  data?.communities.length
                                ) {
                                  handleUncheckAll();
                                } else {
                                  handleCheckAll();
                                }
                              }}
                              sx={{
                                minWidth: "unset",
                                padding: "2px 6px",
                                fontSize: "0.7rem",
                                backgroundColor: "green",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "blue",
                                },
                              }}
                            >
                              {selectedCommunities.size ===
                              data?.communities.length
                                ? "Uncheck All"
                                : "Check All"}
                            </Button>
                          </TableCell>
                          <TableCell sx={{ width: "70px", textAlign: "left" }}>
                            Rank
                          </TableCell>
                          <TableCell
                            sx={{
                              width: "40px",
                              textAlign: "left",
                              paddingRight: "8px",
                            }}
                          >
                            Size
                          </TableCell>
                          <TableCell sx={{ textAlign: "right" }}></TableCell>
                        </TableRow>
                      </TableHead>
                    </Table>
                    <Table>
                      <TableBody>
                        {sortedCommunities.map(
                          (community: Community, index: number) => (
                            <TableRow
                              key={community.community_id}
                              sx={{
                                cursor: "pointer",
                                height: "5px",
                                padding: 0,
                                margin: 0,
                              }}
                              onClick={() => {
                                const inputElement =
                                  document.createElement("input");
                                inputElement.type = "checkbox";
                                inputElement.name =
                                  community.community_id.toString();
                                inputElement.checked = !selectedCommunities.has(
                                  community.community_id
                                );

                                const event = new Event("change", {
                                  bubbles: true,
                                });
                                inputElement.dispatchEvent(event);

                                handleCommunityChange({
                                  target: inputElement,
                                } as React.ChangeEvent<HTMLInputElement>);
                              }}
                            >
                              <TableCell
                                sx={{
                                  padding: "0 8px",
                                  height: "5px",
                                  lineHeight: "0.1",
                                }}
                              >
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Checkbox
                                    checked={selectedCommunities.has(
                                      community.community_id
                                    )}
                                    onChange={handleCommunityChange}
                                    name={community.community_id.toString()}
                                    sx={{ padding: "0 8px" }}
                                  />
                                  <ColorBox
                                    color={
                                      communityColors[community.community_id]
                                    }
                                  />
                                </Box>
                              </TableCell>
                              <TableCell
                                sx={{ height: "5px", lineHeight: "0.1" }}
                              >
                                {index + 1}
                              </TableCell>
                              <TableCell
                                sx={{ height: "5px", lineHeight: "0.1" }}
                              >
                                {community.size}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
              </ClusterPanel>

              <Box
                sx={{
                  position: "absolute",
                  top: "15%",
                  left: "1%",
                  zIndex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  padding: "2%",
                  borderRadius: 2,
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1%",
                  width: isMobile ? "80%" : "18.3%",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography variant="h6">Scope</Typography>
                  <Tooltip
                    title={
                      <Box sx={{ textAlign: "justify" }}>
                        <Typography variant="body2">
                          <strong>Transaction:</strong> The community detection
                          considers all Owners and their transaction history
                          within the selected collection.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Ownership:</strong> The community detection
                          considers all NFTs and Owners and their ownership
                          history within the selected collection.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>All:</strong> The community detection
                          considers all NFTs and Owners and all their different
                          kinds of interactions (transactions, ownerships, and
                          mint events).
                        </Typography>
                      </Box>
                    }
                    placement="right"
                  >
                    <InfoIcon sx={{ ml: 1, cursor: "pointer" }} />
                  </Tooltip>
                </Box>
                <RadioGroup value={formScope} onChange={handleScopeChange}>
                  <FormControlLabel
                    value="transaction"
                    control={<Radio />}
                    label="Transaction"
                  />
                  <FormControlLabel
                    value="ownership"
                    control={<Radio />}
                    label="Ownership"
                  />
                  <FormControlLabel
                    value="all"
                    control={<Radio />}
                    label="All"
                  />
                </RadioGroup>

                <Typography variant="h6">Collection</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formCollections.includes("boredapes")}
                        onChange={handleCollectionChange}
                        name="boredapes"
                      />
                    }
                    label="BoredApes"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formCollections.includes("degods")}
                        onChange={handleCollectionChange}
                        name="degods"
                      />
                    }
                    label="DeGods"
                  />
                </FormGroup>
                <Button
                  variant="contained"
                  onClick={handleUpdateGraph}
                  sx={{ marginTop: 2 }}
                >
                  Update Graph
                </Button>
              </Box>
            </>
          )}

          {isMobile && (
            <>
              <Box
                sx={{
                  position: "absolute",
                  bottom: "1%",
                  right: 10,
                  zIndex: 1001,

                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <IconButton
                  onClick={() => {
                    toggleClusterPanelDrawer();
                    if (isFullscreen) {
                      setClusterPanelOpen(true); // Ensure the panel opens in fullscreen
                    }
                  }}
                  aria-label="toggle cluster panel"
                >
                  <InfoIcon />
                </IconButton>

                <IconButton
                  onClick={toggleScopePanelDrawer}
                  aria-label="toggle scope panel"
                >
                  <InfoIcon />
                </IconButton>
                <IconButton
                  onClick={toggleLegendDrawer}
                  aria-label="toggle legend"
                >
                  <InfoIcon />
                </IconButton>
              </Box>

              <Drawer
                anchor="bottom"
                open={isClusterPanelOpen}
                onClose={toggleClusterPanelDrawer}
                sx={{ zIndex: 1100 }} // Ensure it's on top
              >
                <Box
                  sx={{
                    width: "100vw",
                    padding: 2,
                    backgroundColor: "white",
                    height: "50vh",
                    overflowY: "auto",
                  }}
                >
                  <IconButton onClick={toggleClusterPanelDrawer}>
                    <CloseIcon />
                  </IconButton>

                  <Typography variant="body1">
                    Top 10 Communities ({selectedCommunities.size}/
                    {data?.communities.length})
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          height: "10px",
                        }}
                      >
                        <TableCell
                          sx={{
                            width: "120px",
                            textAlign: "left",
                            paddingLeft: "8px",
                          }}
                        >
                          <Button
                            onClick={() => {
                              if (
                                selectedCommunities.size ===
                                data?.communities.length
                              ) {
                                handleUncheckAll();
                              } else {
                                handleCheckAll();
                              }
                            }}
                            sx={{
                              minWidth: "unset",
                              padding: "2px 6px",
                              fontSize: "0.7rem",
                              backgroundColor: "green",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "blue",
                              },
                            }}
                          >
                            {selectedCommunities.size ===
                            data?.communities.length
                              ? "Uncheck All"
                              : "Check All"}
                          </Button>
                        </TableCell>
                        <TableCell sx={{ width: "70px", textAlign: "left" }}>
                          Rank
                        </TableCell>
                        <TableCell
                          sx={{
                            width: "40px",
                            textAlign: "left",
                            paddingRight: "8px",
                          }}
                        >
                          Size
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}></TableCell>
                      </TableRow>
                    </TableHead>
                  </Table>
                  <Table>
                    <TableBody>
                      {sortedCommunities.map(
                        (community: Community, index: number) => (
                          <TableRow
                            key={community.community_id}
                            sx={{
                              cursor: "pointer",
                              height: "5px",
                              padding: 0,
                              margin: 0,
                            }}
                            onClick={() => {
                              const inputElement =
                                document.createElement("input");
                              inputElement.type = "checkbox";
                              inputElement.name =
                                community.community_id.toString();
                              inputElement.checked = !selectedCommunities.has(
                                community.community_id
                              );

                              const event = new Event("change", {
                                bubbles: true,
                              });
                              inputElement.dispatchEvent(event);

                              handleCommunityChange({
                                target: inputElement,
                              } as React.ChangeEvent<HTMLInputElement>);
                            }}
                          >
                            <TableCell
                              sx={{
                                padding: "0 8px",
                                height: "5px",
                                lineHeight: "0.1",
                              }}
                            >
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Checkbox
                                  checked={selectedCommunities.has(
                                    community.community_id
                                  )}
                                  onChange={handleCommunityChange}
                                  name={community.community_id.toString()}
                                  sx={{ padding: "0 8px" }}
                                />
                                <ColorBox
                                  color={
                                    communityColors[community.community_id]
                                  }
                                />
                              </Box>
                            </TableCell>
                            <TableCell
                              sx={{ height: "5px", lineHeight: "0.1" }}
                            >
                              {index + 1}
                            </TableCell>
                            <TableCell
                              sx={{ height: "5px", lineHeight: "0.1" }}
                            >
                              {community.size}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Drawer>

              <Drawer
                anchor="bottom"
                open={isScopePanelOpen}
                onClose={toggleScopePanelDrawer}
              >
                <Box
                  sx={{
                    width: "100vw",
                    padding: 2,
                    backgroundColor: "white",
                    height: "50vh",
                    overflowY: "auto",
                  }}
                >
                  <IconButton onClick={toggleScopePanelDrawer}>
                    <CloseIcon />
                  </IconButton>
                  <Typography variant="h6">Scope</Typography>
                  <RadioGroup value={formScope} onChange={handleScopeChange}>
                    <FormControlLabel
                      value="transaction"
                      control={<Radio />}
                      label="Transaction"
                    />
                    <FormControlLabel
                      value="ownership"
                      control={<Radio />}
                      label="Ownership"
                    />
                    <FormControlLabel
                      value="all"
                      control={<Radio />}
                      label="All"
                    />
                  </RadioGroup>
                  <Typography variant="h6">Collection</Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formCollections.includes("boredapes")}
                          onChange={handleCollectionChange}
                          name="boredapes"
                        />
                      }
                      label="BoredApes"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formCollections.includes("degods")}
                          onChange={handleCollectionChange}
                          name="degods"
                        />
                      }
                      label="DeGods"
                    />
                  </FormGroup>
                  <Button
                    variant="contained"
                    onClick={handleUpdateGraph}
                    sx={{ marginTop: 2 }}
                  >
                    Update Graph
                  </Button>
                </Box>
              </Drawer>

              <Drawer
                anchor="bottom"
                open={isLegendOpen}
                onClose={toggleLegendDrawer}
              >
                <Box
                  sx={{
                    width: "100vw",
                    padding: 2,
                    backgroundColor: "white",
                    height: "20vh",
                    overflowY: "auto",
                  }}
                >
                  <IconButton onClick={toggleLegendDrawer}>
                    <CloseIcon />
                  </IconButton>
                  <Typography variant="body1">Edge Count Range</Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      mt: 1,
                      width: "100%",
                    }}
                  >
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      0
                    </Typography>
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: 20,
                        width: "100%",
                        background: `linear-gradient(to right, ${getColorScale(
                          0,
                          maxCount
                        )}, ${getColorScale(maxCount, maxCount)})`,
                        mx: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {maxCount}
                    </Typography>
                  </Box>
                </Box>
              </Drawer>
            </>
          )}

          <ControlContainer>
            <IconButton onClick={handleZoomIn} aria-label="zoom in">
              <ZoomInIcon style={{ fontSize: "2vw" }} />
            </IconButton>
            <IconButton onClick={handleZoomOut} aria-label="zoom out">
              <ZoomOutIcon style={{ fontSize: "2vw" }} />
            </IconButton>
            <IconButton onClick={handleResetZoom} aria-label="reset zoom">
              <RefreshIcon style={{ fontSize: "2vw" }} />
            </IconButton>
            <IconButton onClick={handleCenter} aria-label="center">
              <CenterFocusStrongIcon style={{ fontSize: "2vw" }} />
            </IconButton>
            {!isMobile && (
              <IconButton onClick={handleFullscreen} aria-label="fullscreen">
                {isFullscreen ? (
                  <FullscreenExitIcon style={{ fontSize: "2vw" }} />
                ) : (
                  <FullscreenIcon style={{ fontSize: "2vw" }} />
                )}
              </IconButton>
            )}
          </ControlContainer>

          {!isMobile && (
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                right: 10,
                zIndex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                padding: 2,
                borderRadius: 2,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                width: isMobile ? "40vw" : "300px",
              }}
            >
              <Typography variant="body1">Edge Count Range</Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  mt: 1,
                  width: "100%",
                }}
              >
                <Typography variant="body2" sx={{ mr: 1 }}>
                  0
                </Typography>
                <Box
                  sx={{
                    flexGrow: 1,
                    height: 20,
                    width: "100%",
                    background: `linear-gradient(to right, ${getColorScale(
                      0,
                      maxCount
                    )}, ${getColorScale(maxCount, maxCount)})`,
                    mx: 1,
                  }}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {maxCount}
                </Typography>
              </Box>
            </Box>
          )}

          <div
            ref={cyRef}
            style={{ width: "100%", height: "100%", border: "1px solid #ccc" }}
          />
        </>
      )}
      {selectedTab === 1 && !isFullscreen && <GraphTab />}
      {hoveredNode && (
        <Card
          sx={{
            position: "absolute",
            bottom: 10, // Adjust according to the legend position
            right: 350, // Adjust according to the legend position
            width: "15vw",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <CardContent>
            <Typography variant="h6">Node Information</Typography>
            <Typography variant="body2">Size: {hoveredNode.size}</Typography>
            <Typography variant="body2">
              NFT Share DeGods: {hoveredNode.nft_share_degods}
            </Typography>
            <Typography variant="body2">
              NFT Share BoredApes: {hoveredNode.nft_share_boredapes}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SummaryGraph;

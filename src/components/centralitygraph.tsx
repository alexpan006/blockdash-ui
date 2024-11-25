import React, { useEffect, useRef, useState, useCallback } from "react";
import cytoscape, {
  ElementDefinition,
  Core,
  NodeSingular,
  EdgeSingular,
  EventObject,
} from "cytoscape";
import {
  Box,
  CircularProgress,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Tooltip,
  useMediaQuery,
  useTheme,
  Collapse,
} from "@mui/material";
import { styled } from "@mui/system";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface Node {
  value: string;
  link: string;
  collection: string | null;
  type: string;
  image: string;
  centrality_score: number;
  rank?: number;
}

interface Relationship {
  from_: Node;
  to: Node;
  relationship: {
    property: string | string[];
    link: string | string[];
    type: string;
    transaction_event_type: string[];
    nft_identifier: string[];
    nft_collection: string[];
    relationship_count: number;
  };
}

interface Data {
  nodes: Node[];
  ownership_relations: Relationship[];
  transaction_relations: Relationship[];
  mint_relations: Relationship[];
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
    left: "1%",
  },
});

const LegendContainer = styled("div")(({ theme }) => ({
  position: "absolute",
  bottom: "2%",
  right: "1%",
  display: "flex",
  alignItems: "center",
  gap: "1%",
  zIndex: 1000,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  padding: "1%",
  borderRadius: "5px",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  width: "23%",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "5px",
    width: "30%",
  },
}));

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

const edgeColors = {
  ownership: "#1f77b4",
  transaction: "#FFD700",
  mint: "#2ca02c",
  selected: "#FF0000",
};

const mapCollectionName = (collectionName: string) => {
  const collectionMap: { [key: string]: string } = {
    "degods-eth": "DeGods",
    boredapeyachtclub: "BoredApes",
  };
  return collectionMap[collectionName] || collectionName;
};

const CentralityGraph: React.FC = () => {
  const cyRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(20);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collections, setCollections] = useState<string[]>([
    "degods",
    "boredapes",
  ]);
  const [formCollections, setFormCollections] = useState<{
    [key: string]: boolean;
  }>({
    degods: true,
    boredapes: true,
  });
  const [updateGraph, setUpdateGraph] = useState(false);
  const cyInstance = useRef<Core | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);
  const [isCollectionBoxOpen, setIsCollectionBoxOpen] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [isAnimating, setIsAnimating] = useState(true);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    const collectionQuery = collections
      .map((col) => `collection=${col}`)
      .join("&");
    const url = `/api/centralitygraph?${collectionQuery}&limit=${limit}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const result: Data = await response.json();
      setData(result);
      setHoveredNode(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (updateGraph) {
      fetchData();
      setUpdateGraph(false);
    }
  }, [updateGraph]);

  useEffect(() => {
    if (!data || !cyRef.current) return;

    const nodesWithRank = [...data.nodes]
      .sort((a, b) => b.centrality_score - a.centrality_score)
      .map((node, index) => ({
        ...node,
        rank: index + 1,
      }));

    const maxCentralityScore = Math.max(
      ...nodesWithRank.map((node) => node.centrality_score)
    );

    const elements: ElementDefinition[] = [
      ...nodesWithRank.map((node, index) => ({
        data: {
          id: node.value,
          label: node.rank ? node.rank.toString() : "",
          image: node.image,
          collection: node.collection,
          type: node.type,
          centrality_score: node.centrality_score,
          rank: node.rank,
          link: node.link,
          color: generateColor(index),
        },
      })),
      ...data.ownership_relations.map((relation, index) => ({
        data: {
          id: `${relation.from_.value}-${relation.to.value}`,
          source: relation.from_.value,
          target: relation.to.value,
          property: relation.relationship.property || `property-${index}`,
          type: "ownership",
          transactionEventType: relation.relationship.transaction_event_type,
          nftIdentifier: relation.relationship.nft_identifier,
          nftCollection: relation.relationship.nft_collection,
          color: edgeColors.ownership,
        },
      })),
      ...data.transaction_relations.map((relation, index) => ({
        data: {
          id: `${relation.from_.value}-${relation.to.value}`,
          source: relation.from_.value,
          target: relation.to.value,
          count: relation.relationship.relationship_count,
          type: "transaction",
          property: relation.relationship.property || `property-${index}`,
          transactionEventType: relation.relationship.transaction_event_type,
          nftIdentifier: relation.relationship.nft_identifier,
          nftCollection: relation.relationship.nft_collection,
          link: relation.relationship.link,
          color: edgeColors.transaction,
        },
      })),
      ...data.mint_relations.map((relation, index) => ({
        data: {
          id: `${relation.from_.value}-${relation.to.value}`,
          source: relation.from_.value,
          target: relation.to.value,
          property: relation.relationship.property || `property-${index}`,
          type: "mint",
          transactionEventType: relation.relationship.transaction_event_type,
          nftIdentifier: relation.relationship.nft_identifier,
          nftCollection: relation.relationship.nft_collection,
          color: edgeColors.mint,
        },
      })),
    ];

    if (elements.length === 0) {
      return;
    }

    try {
      const cy = cytoscape({
        container: cyRef.current,
        elements,
        style: [
          {
            selector: "node",
            style: {
              label: "data(label)",
              width: (ele: NodeSingular) =>
                10 +
                (ele.data("centrality_score") / maxCentralityScore) * 10 +
                "%",
              height: (ele: NodeSingular) =>
                10 +
                (ele.data("centrality_score") / maxCentralityScore) * 10 +
                "%",
              "background-color": "data(color)",
              "background-image": (ele: NodeSingular) =>
                ele.data("image") ? `url(${ele.data("image")})` : "none",
              "background-fit": "cover",
              "border-width": 2,
              "border-color": "#1f77b4",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "12px",
              color: "#000",
            },
          },
          {
            selector: "node:selected",
            style: {
              "border-width": 4,
              "border-color": "#FF0000",
            },
          },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "data(color)",
              "target-arrow-color": "data(color)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
            },
          },
          {
            selector: "edge:selected",
            style: {
              "line-color": "#FF0000",
              "target-arrow-color": "#FF0000",
            },
          },
        ],
        layout: {
          name: "circle",
        },
      });
      cyInstance.current = cy;

      cy.layout({
        name: "circle",
        radius: 300,
        startAngle: (3 / 2) * Math.PI,
        padding: 100,
        avoidOverlap: true,
      }).run();
      cy.fit(cy.nodes());
      cy.center();

      cy.on("mouseover", "node, edge", (event) => {
        cy.container().style.cursor = "pointer";

        const target = event.target;

        if (target.data("id")) {
          handleNodeMouseOver(event as cytoscape.EventObject);
        } else if (target.data("source") && target.data("target")) {
          handleEdgeMouseOver(event as cytoscape.EventObject);
        }
      });

      cy.on("mouseout", "node, edge", (event) => {
        cy.container().style.cursor = "default";

        const target = event.target;

        if (target.data("id")) {
          handleNodeMouseOut(event as cytoscape.EventObject);
        } else if (target.data("source") && target.data("target")) {
          handleEdgeMouseOut(event as cytoscape.EventObject);
        }
      });

      cy.on("tap", "node", (event: EventObject) => {
        const node = event.target as NodeSingular;
        cyInstance.current?.elements("node").forEach((ele) => {
          ele.removeClass("selected");
        });
        node.addClass("selected");
        const nodeData = node.data();
        setHoveredNode({
          value: nodeData.id,
          collection: nodeData.collection,
          type: nodeData.type,
          image: nodeData.image,
          centrality_score: nodeData.centrality_score,
          rank: nodeData.rank || 1,
          link: nodeData.link,
        });
      });

      cy.on("tap", "edge", (event: EventObject) => {
        const edge = event.target as EdgeSingular;
        cyInstance.current?.elements("edge").forEach((ele) => {
          ele.removeClass("selected");
        });
        edge.addClass("selected");
        setSelectedEdge(edge);
        setHoveredNode(null);
      });

      if (isAnimating) {
        floatNodes();
      }
      return () => {
        if (cyInstance.current) {
          cyInstance.current.destroy();
          cyInstance.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing Cytoscape:", error);
    }
  }, [data, isAnimating]);

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
      const progress = (elapsedTime % 10000) / 10000;
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

      node.data("size", 40 + currentSizeChange);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);
  };

  const handleAnimationToggle = () => {
    setIsAnimating((prev) => {
      if (!prev && cyInstance.current) {
        floatNodes();
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

  const handleNodeMouseOver = (event: EventObject) => {
    const node = event.target as NodeSingular;
    console.log("Node hovered over:", node.data());
  };

  const handleNodeMouseOut = (event: EventObject) => {
    console.log("Node hover out:", event.target.data());
  };

  const handleEdgeMouseOver = (event: EventObject) => {
    const edge = event.target as cytoscape.EdgeSingular;
    console.log("Edge hovered over:", edge.data());
  };

  const handleEdgeMouseOut = (event: EventObject) => {
    console.log("Edge hover out:", event.target.data());
  };

  const handleCollectionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormCollections({
      ...formCollections,
      [event.target.name]: event.target.checked,
    });
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
  };

  const handleUpdateGraph = () => {
    const selectedCollections = Object.keys(formCollections).filter(
      (key) => formCollections[key]
    );
    setCollections(selectedCollections);
    setUpdateGraph(true);
  };

  const handleZoomIn = () => {
    cyInstance.current?.zoom(cyInstance.current.zoom() + 0.1);
  };

  const handleZoomOut = () => {
    cyInstance.current?.zoom(cyInstance.current.zoom() - 0.1);
  };

  const handleCenterGraph = () => {
    cyInstance.current?.center();
  };

  const handleRefreshGraph = () => {
    setUpdateGraph(true);
  };

  const handleCloseCard = () => {
    setHoveredNode(null);
  };

  const handleCloseTable = () => {
    setSelectedEdge(null);
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy text using Clipboard API: ", err);
        fallbackCopyTextToClipboard(text);
      });
    } else {
      console.warn(
        "Clipboard API not supported or available in this context, using fallback method."
      );
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
    }

    document.body.removeChild(textArea);
  };

  const renderEdgeInfo = (edge: EdgeSingular) => {
    const data = edge.data();
    return (
      <>
        {data.source && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2">Source: {data.source}</Typography>
            <Tooltip title="Copy">
              <IconButton
                aria-label="copy"
                size="small"
                onClick={() => handleCopy(data.source)}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {data.target && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2">Target: {data.target}</Typography>
            <Tooltip title="Copy">
              <IconButton
                aria-label="copy"
                size="small"
                onClick={() => handleCopy(data.target)}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {data.property && data.type === "ownership" && (
          <Typography variant="body2">
            Currently Owns: {data.property}
          </Typography>
        )}
        {data.property && data.type === "mint" && (
          <Typography variant="body2">Mint At: {data.property}</Typography>
        )}
        {data.transactionEventType &&
          Array.isArray(data.transactionEventType) &&
          data.transactionEventType.filter((t: string) => t).length > 0 && (
            <Typography variant="body2">
              Transaction Event Type:{" "}
              {data.transactionEventType.filter((t: string) => t).join(", ")}
            </Typography>
          )}
        {data.nftIdentifier &&
          Array.isArray(data.nftIdentifier) &&
          data.nftIdentifier.filter((n: string) => n).length > 0 && (
            <Typography variant="body2">
              NFT Identifier:{" "}
              {data.nftIdentifier.filter((n: string) => n).join(", ")}
            </Typography>
          )}
        {data.nftCollection &&
          Array.isArray(data.nftCollection) &&
          data.nftCollection.filter((n: string) => n).length > 0 && (
            <Typography variant="body2">
              NFT Collection:{" "}
              {mapCollectionName(
                data.nftCollection.filter((n: string) => n).join(", ")
              )}
            </Typography>
          )}
      </>
    );
  };

  const commonWidth = isMobile ? "85%" : "30%";

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current
        ?.requestFullscreen()
        .then(() => setIsFullscreen(true));
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

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
        border: "1px solid #ccc",
      }}
    >
      <Button
        variant="contained"
        onClick={handleAnimationToggle}
        style={{ position: "absolute", bottom: "2%", left: "25%", zIndex: 10 }}
      >
        {isAnimating ? "Stop Animation" : "Start Animation"}
      </Button>

      {isMobile && (
        <IconButton
          onClick={() => setIsCollectionBoxOpen(!isCollectionBoxOpen)}
          aria-label="toggle collection box"
          sx={{
            position: "absolute",
            top: "8%",
            left: "2%",
            zIndex: 2,
          }}
        >
          {isCollectionBoxOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      )}

      <Collapse
        in={isCollectionBoxOpen || !isMobile}
        timeout="auto"
        unmountOnExit
      >
        <Box
          sx={{
            position: "absolute",
            top: isMobile ? "10%" : "15%",
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
          <Typography variant="h6">Collections</Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formCollections.degods}
                  onChange={handleCollectionChange}
                  name="degods"
                />
              }
              label="DeGods"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formCollections.boredapes}
                  onChange={handleCollectionChange}
                  name="boredapes"
                />
              }
              label="BoredApes"
            />
          </FormGroup>
          <TextField
            label="Limit"
            type="number"
            value={limit}
            onChange={handleLimitChange}
            fullWidth
            sx={{ marginBottom: "5%" }}
          />
          <Button variant="contained" onClick={handleUpdateGraph} fullWidth>
            Update Graph
          </Button>
        </Box>
      </Collapse>

      <ControlContainer>
        <IconButton onClick={handleZoomIn} aria-label="zoom in">
          <ZoomInIcon style={{ fontSize: "2vw" }} />
        </IconButton>
        <IconButton onClick={handleZoomOut} aria-label="zoom out">
          <ZoomOutIcon style={{ fontSize: "2vw" }} />
        </IconButton>
        <IconButton onClick={handleRefreshGraph} aria-label="refresh">
          <RefreshIcon style={{ fontSize: "2vw" }} />
        </IconButton>
        <IconButton onClick={handleCenterGraph} aria-label="center">
          <CenterFocusStrongIcon style={{ fontSize: "2vw" }} />
        </IconButton>
        {!isMobile && (
          <IconButton onClick={handleFullscreenToggle} aria-label="fullscreen">
            {isFullscreen ? (
              <FullscreenExitIcon style={{ fontSize: "2vw" }} />
            ) : (
              <FullscreenIcon style={{ fontSize: "2vw" }} />
            )}
          </IconButton>
        )}
      </ControlContainer>
      <div ref={cyRef} style={{ width: "100%", height: "100%" }} />
      <LegendContainer>
        <Typography variant="body2" sx={{ marginRight: "5%" }}>
          Relation Types
        </Typography>
        <Typography variant="body2" style={{ color: edgeColors.ownership }}>
          Ownership
        </Typography>
        <Typography variant="body2" style={{ color: edgeColors.transaction }}>
          Transaction
        </Typography>
        <Typography variant="body2" style={{ color: edgeColors.mint }}>
          Mint
        </Typography>
      </LegendContainer>
      {hoveredNode && (
        <Card
          sx={{
            position: "absolute",
            bottom: isMobile ? "20%" : "15%",
            right: "1%",
            width: commonWidth,
            zIndex: 2,
            maxHeight: "80%", // Restrict the height of the card
            overflowY: "auto", // Enable vertical scrolling if content exceeds max height
            overflowX: "auto", // Enable horizontal scrolling if content exceeds width
          }}
        >
          <CardContent sx={{ padding: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: "1rem", marginBottom: 0.5 }}
            >
              Node Information
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", marginBottom: 0.5 }}
            >
              <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                Rank: {hoveredNode.rank}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", alignItems: "center", marginBottom: 0.5 }}
            >
              <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                Value: {hoveredNode.value}
              </Typography>
              <Tooltip title="Copy">
                <IconButton
                  aria-label="copy"
                  size="small"
                  onClick={() => handleCopy(hoveredNode.value)}
                  sx={{ padding: 0.5 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              variant="body2"
              sx={{ fontSize: "0.875rem", marginBottom: 0.5 }}
            >
              Link:{" "}
              <a
                href={hoveredNode.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {hoveredNode.type === "NFT"
                  ? "View on Opensea"
                  : "View on Etherscan"}
              </a>
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: "0.875rem", marginBottom: 0.5 }}
            >
              Centrality Score: {hoveredNode.centrality_score}
            </Typography>
            {hoveredNode.collection && (
              <Typography
                variant="body2"
                sx={{ fontSize: "0.875rem", marginBottom: 0.5 }}
              >
                Collection: {mapCollectionName(hoveredNode.collection)}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{ fontSize: "0.875rem", marginBottom: 0.5 }}
            >
              Type: {hoveredNode.type}
            </Typography>
            {hoveredNode.image && (
              <img
                src={hoveredNode.image}
                alt="Node"
                style={{ width: "100%", marginTop: "1%" }}
              />
            )}
            <IconButton
              aria-label="close"
              size="small"
              onClick={handleCloseCard}
              sx={{
                position: "absolute",
                top: "2%",
                right: "2%",
                padding: 0.5,
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </CardContent>
        </Card>
      )}
      {selectedEdge && selectedEdge.data("type") !== "transaction" && (
        <Card
          sx={{
            position: "absolute",
            bottom: isMobile ? "20%" : "15%",
            right: "1%",
            width: commonWidth,
            zIndex: 2,
            overflowX: "auto", // Enable horizontal scrolling if content exceeds width
          }}
        >
          <CardContent>
            <Typography variant="h6">Edge Information</Typography>
            {renderEdgeInfo(selectedEdge)}
            <IconButton
              aria-label="close"
              size="small"
              onClick={handleCloseTable}
              sx={{ position: "absolute", top: "2%", right: "2%" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </CardContent>
        </Card>
      )}
      {selectedEdge && selectedEdge.data("type") === "transaction" && (
        <Box
          sx={{
            position: "absolute",
            top: "2%",
            right: "2%",
            zIndex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "2%",
            borderRadius: 2,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            maxHeight: "50%",
            overflow: "auto",
            width: isMobile ? "95%" : "75%",
            maxWidth: 1500,
            [theme.breakpoints.down("sm")]: {
              top: "10%",
            },
          }}
        >
          <Typography variant="h6">
            Number of transactions=
            {selectedEdge.data("type") === "transaction"
              ? selectedEdge.data("count")
              : 0}
          </Typography>
          <IconButton
            aria-label="close"
            size="small"
            onClick={handleCloseTable}
            sx={{
              position: "absolute",
              top: "2%",
              right: "2%",
              [theme.breakpoints.down("sm")]: {
                "& .MuiSvgIcon-root": {
                  fontSize: "1rem",
                },
                padding: "4px",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <TableContainer
            component={Paper}
            sx={{ width: "100%", overflowX: "auto" }}
          >
            <Table stickyHeader sx={{ tableLayout: "auto", width: "100%" }}>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Transaction Hash</TableCell>
                  <TableCell>Event_Type</TableCell>
                  <TableCell>NFT_Identifier</TableCell>
                  <TableCell>NFT_Collection</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.transaction_relations
                  .filter(
                    (relation) =>
                      relation.from_.value === selectedEdge.data("source") &&
                      relation.to.value === selectedEdge.data("target")
                  )
                  .flatMap((relation, idx) => {
                    const properties = Array.isArray(
                      relation.relationship.property
                    )
                      ? relation.relationship.property
                      : relation.relationship.property
                      ? relation.relationship.property.split(",")
                      : [];
                    const eventTypes =
                      relation.relationship.transaction_event_type || [];
                    const nftIdentifiers =
                      relation.relationship.nft_identifier || [];
                    const nftCollections =
                      relation.relationship.nft_collection || [];
                    const links = Array.isArray(relation.relationship.link)
                      ? relation.relationship.link
                      : [relation.relationship.link];

                    return properties.map((property, i) => ({
                      index: idx + 1,
                      property,
                      eventType: eventTypes[i] || "",
                      nftIdentifier: nftIdentifiers[i] || "",
                      nftCollection: nftCollections[i] || "",
                      link: links[i] || "",
                    }));
                  })
                  .map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.property}
                        </a>
                      </TableCell>
                      <TableCell>{item.eventType}</TableCell>
                      <TableCell>{item.nftIdentifier}</TableCell>
                      <TableCell>
                        {mapCollectionName(item.nftCollection)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            zIndex: 2,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            zIndex: 2,
          }}
        >
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CentralityGraph;

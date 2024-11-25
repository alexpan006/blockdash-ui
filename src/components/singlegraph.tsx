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
  Typography,
  Button,
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
  TextField,
  Collapse,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { styled } from "@mui/system";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface Node {
  value: string;
  collection: string;
  type: string;
  image: string;
  link: string;
  centrality_score: number;
}

interface Relationship {
  from_: Node;
  to: Node;
  relationship: {
    property: string;
    type: string;
    transaction_event_type: string;
    nft_identifier: string;
    nft_collection: string;
    link_etherscan: string;
  };
}

interface Data {
  community_id: number;
  total_node_count: number;
  total_nft: number;
  nft_share_degods: number;
  nft_share_boredapes: number;
  nodes: Node[];
  ownership_relations: Relationship[];
  transaction_relations: Relationship[];
  mint_relations: Relationship[];
}

interface SingleGraphProps {
  data: Data;
  fetchData: (limit: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
}

const ControlContainer = styled("div")(({ theme }) => ({
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
}));

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
  width: "25%",
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

const mapCollectionName = (collection: string) => {
  switch (collection) {
    case "boredapeyachtclub":
      return "BoredApes";
    case "degods-eth":
      return "DeGods";
    default:
      return collection;
  }
};

const handleNodeMouseOver = (event: EventObject) => {
  const node = event.target as cytoscape.NodeSingular;
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

const SingleGraph: React.FC<SingleGraphProps> = ({
  data,
  fetchData,
  limit,
  setLimit,
}) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);
  const [isTableVisible, setIsTableVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inputLimit, setInputLimit] = useState<number>(limit);
  const [sortedNodes, setSortedNodes] = useState<Node[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationFrameId = useRef<number | null>(null);
  const [isCommunitySizeBoxOpen, setIsCommunitySizeBoxOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const validateNode = (node: Node) => {
    return (
      node &&
      node.value &&
      node.collection !== undefined &&
      node.type !== undefined
    );
  };

  const validateRelationship = (rel: Relationship) => {
    return (
      rel &&
      rel.from_ &&
      rel.to &&
      rel.relationship &&
      rel.relationship.property !== undefined &&
      rel.relationship.type !== undefined &&
      rel.relationship.transaction_event_type !== undefined &&
      rel.relationship.nft_identifier !== undefined &&
      rel.relationship.nft_collection !== undefined &&
      rel.relationship.link_etherscan !== undefined
    );
  };

  useEffect(() => {
    if (!cyRef.current || !data.nodes || data.nodes.length === 0) {
      console.error("Invalid data or container reference");
      return;
    }

    const sorted = data.nodes
      .filter(validateNode)
      .sort((a, b) => b.centrality_score - a.centrality_score);

    setSortedNodes(sorted);

    const nodes: ElementDefinition[] = sorted.map((node, index) => ({
      data: {
        id: node.value || `node-${index}`,
        value: node.value,
        image: node.image || "",
        collection: node.collection || "",
        type: node.type || "",
        link: node.link || "",
        centrality_score: node.centrality_score,
        color: generateColor(index),
        label: `${index + 1}`,
      },
    }));

    const ownershipEdges: ElementDefinition[] = data.ownership_relations
      .filter(validateRelationship)
      .map((rel: Relationship, index: number) => ({
        data: {
          id: `${rel.from_.value || `from-${index}`}-${
            rel.to.value || `to-${index}`
          }`,
          source: rel.from_.value || `from-${index}`,
          target: rel.to.value || `to-${index}`,
          property: rel.relationship.property || `property-${index}`,
          type: "ownership",
          transactionEventType: rel.relationship.transaction_event_type,
          nftIdentifier: rel.relationship.nft_identifier,
          nftCollection: rel.relationship.nft_collection,
          linkEtherscan: rel.relationship.link_etherscan,
        },
      }));

    const transactionEdges: ElementDefinition[] = data.transaction_relations
      .filter(validateRelationship)
      .map((rel: Relationship, index: number) => ({
        data: {
          id: `${rel.from_.value || `from-${index}`}-${
            rel.to.value || `to-${index}`
          }`,
          source: rel.from_.value || `from-${index}`,
          target: rel.to.value || `to-${index}`,
          property: rel.relationship.property || `property-${index}`,
          type: "transaction",
          transactionEventType: rel.relationship.transaction_event_type,
          nftIdentifier: rel.relationship.nft_identifier,
          nftCollection: rel.relationship.nft_collection,
          linkEtherscan: rel.relationship.link_etherscan,
        },
      }));

    const mintEdges: ElementDefinition[] = data.mint_relations
      .filter(validateRelationship)
      .map((rel: Relationship, index: number) => ({
        data: {
          id: `${rel.from_.value || `from-${index}`}-${
            rel.to.value || `to-${index}`
          }`,
          source: rel.from_.value || `from-${index}`,
          target: rel.to.value || `to-${index}`,
          property: rel.relationship.property || `property-${index}`,
          type: "mint",
          transactionEventType: rel.relationship.transaction_event_type,
          nftIdentifier: rel.relationship.nft_identifier,
          nftCollection: rel.relationship.nft_collection,
          linkEtherscan: rel.relationship.link_etherscan,
        },
      }));

    const elements: ElementDefinition[] = [
      ...nodes,
      ...ownershipEdges,
      ...transactionEdges,
      ...mintEdges,
    ];

    if (elements.length === 0) {
      console.error("No elements found for Cytoscape");
      return;
    }

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    try {
      const cy = cytoscape({
        container: cyRef.current,
        elements,
        style: [
          {
            selector: "node",
            style: {
              width: isMobile ? 15 : 20,
              height: isMobile ? 15 : 20,
              shape: "ellipse",
              "background-color": "data(color)",
              "background-image": (ele: NodeSingular) =>
                ele.data("image") ? `url(${ele.data("image")})` : "none",
              "background-fit": "cover",
              "border-width": 2,
              "border-color": "#1f77b4",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": isMobile ? "10px" : "12px",
              color: "#000",
              label: "data(label)",
            },
          },
          {
            selector: "edge[type='ownership']",
            style: {
              width: 2,
              "line-color": edgeColors.ownership,
              "target-arrow-color": edgeColors.ownership,
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
            },
          },
          {
            selector: "edge[type='transaction']",
            style: {
              width: 2,
              "line-color": edgeColors.transaction,
              "target-arrow-color": edgeColors.transaction,
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
            },
          },
          {
            selector: "edge[type='mint']",
            style: {
              width: 2,
              "line-color": edgeColors.mint,
              "target-arrow-color": edgeColors.mint,
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
            },
          },
          {
            selector: "node.selected",
            style: {
              "border-width": 4,
              "border-color": "#FF0000",
              shape: "ellipse",
              width: isMobile ? 15 : 20,
              height: isMobile ? 15 : 20,
            },
          },
          {
            selector: "edge.selected",
            style: {
              "line-color": "#FF0000",
              "target-arrow-color": "#FF0000",
              width: 4,
            },
          },
        ],
        layout: {
          name: "circle",
        },
      });

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

        cy.elements("node").forEach((ele) => {
          ele.removeClass("selected");
        });

        cy.elements("edge").forEach((ele) => {
          ele.removeClass("selected");
        });

        node.addClass("selected");

        const nodeData = node.data();
        setSelectedNode(nodeData);
        setSelectedEdge(null);
      });

      cy.on("tap", "edge", (event: EventObject) => {
        const edge = event.target as EdgeSingular;

        cy.elements("node").forEach((ele) => {
          ele.removeClass("selected");
        });

        cy.elements("edge").forEach((ele) => {
          ele.removeClass("selected");
        });

        edge.addClass("selected");

        setSelectedEdge(edge);
        setSelectedNode(null);
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
      cy.on("tap", "node", (event: EventObject) => {
        const node = event.target as NodeSingular;

        // Deselect all nodes
        cy.elements("node").forEach((ele) => {
          ele.removeClass("selected");
        });

        // Highlight the selected node
        node.addClass("selected");

        const nodeData = node.data();
        setSelectedNode(nodeData);
        setSelectedEdge(null); // Deselect any selected edge
      });

      cy.on("tap", "edge", (event: EventObject) => {
        const edge = event.target as EdgeSingular;

        // Deselect all edges
        cy.elements("edge").forEach((ele) => {
          ele.removeClass("selected");
        });

        // Highlight the selected edge
        edge.addClass("selected");

        setSelectedEdge(edge);
        setSelectedNode(null); // Deselect any selected node
      });
    } catch (error) {
      console.error("Error initializing Cytoscape:", error);
    }

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };

    if (isAnimating) {
      floatNodes();
    }
  }, [data, isMobile, isAnimating]);

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
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputLimit(parseInt(event.target.value, 10));
  };

  const handleUpdateGraph = () => {
    setLimit(inputLimit);
    fetchData(inputLimit);
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
    fetchData(limit);
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCloseCard = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleCopy = (text: string) => {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy text using Clipboard API: ", err);
        fallbackCopyTextToClipboard(text);
      });
    } else {
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

  const mapNFTCollection = (collection: string) => {
    switch (collection) {
      case "boredapeyachtclub":
        return "BoredApes";
      case "degods-eth":
        return "DeGods";
      default:
        return collection;
    }
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
        {data.type === "ownership" && data.property && (
          <Typography variant="body2">
            Currently Owns: {data.property}
          </Typography>
        )}
        {data.type === "mint" && data.property && (
          <Typography variant="body2">Mint At: {data.property}</Typography>
        )}
        {data.transactionEventType && (
          <Typography variant="body2">
            Transaction Event Type: {data.transactionEventType}
          </Typography>
        )}
        {data.nftIdentifier && (
          <Typography variant="body2">
            NFT Identifier: {data.nftIdentifier}
          </Typography>
        )}
        {data.nftCollection && (
          <Typography variant="body2">
            NFT Collection: {mapNFTCollection(data.nftCollection)}
          </Typography>
        )}
        {data.linkEtherscan && (
          <Typography variant="body2">
            Etherscan:{" "}
            <a
              href={data.linkEtherscan}
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.type === "NFT" ? "View on Opensea" : "View on Etherscan"}
            </a>
          </Typography>
        )}
      </>
    );
  };

  const renderNodeInfo = (node: Node) => {
    return (
      <>
        <Typography variant="body2">
          Rank: {sortedNodes.findIndex((n: Node) => n.value === node.value) + 1}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2">Value: {node.value}</Typography>
          <Tooltip title="Copy">
            <IconButton
              aria-label="copy"
              size="small"
              onClick={() => handleCopy(node.value)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="body2">
          Link:{" "}
          <a href={node.link} target="_blank" rel="noopener noreferrer">
            {node.type === "NFT" ? "View on Opensea" : "View on Etherscan"}
          </a>
        </Typography>
        <Typography variant="body2">
          Centrality Score: {node.centrality_score}
        </Typography>
        {node.collection && node.collection !== "N/A" && (
          <Typography variant="body2">
            Collection: {mapCollectionName(node.collection)}
          </Typography>
        )}
        {node.type && node.type !== "N/A" && (
          <Typography variant="body2">Type: {node.type}</Typography>
        )}
        {node.image && (
          <img
            src={node.image}
            alt="Node"
            style={{ width: "100%", marginTop: 10 }}
          />
        )}
      </>
    );
  };

  const renderEdgeCard = (edge: EdgeSingular) => {
    return (
      <Card
        sx={{
          position: "absolute",
          bottom: isMobile ? "22%" : "15%",
          right: "1%",
          width: commonWidth,
          zIndex: 2,
          maxHeight: "80%", // Restrict the height of the card
          overflowY: "auto", // Enable vertical scrolling if content exceeds max height
          overflowX: "auto", // Enable horizontal scrolling if content exceeds width
        }}
      >
        <CardContent>
          <Typography variant="h6">Edge Information</Typography>
          {renderEdgeInfo(edge)}
          <IconButton
            aria-label="close"
            size="small"
            onClick={handleCloseCard}
            sx={{ position: "absolute", top: 5, right: 5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </CardContent>
      </Card>
    );
  };

  const commonWidth = isMobile ? "85%" : "30%";

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
        style={{
          position: "absolute",
          bottom: "2%",
          left: "22%",
          zIndex: 10,
        }}
      >
        {isAnimating ? "Stop Animation" : "Start Animation"}
      </Button>
      {/* Toggle button for collapsing/expanding the ControlContainer */}
      {isMobile && (
        <IconButton
          onClick={() => setIsCommunitySizeBoxOpen(!isCommunitySizeBoxOpen)}
          aria-label="toggle collection box"
          sx={{
            position: "absolute",
            top: "2%",
            left: "2%",
            zIndex: 2,
          }}
        >
          {isCommunitySizeBoxOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      )}

      <Collapse
        in={isCommunitySizeBoxOpen || !isMobile}
        timeout="auto"
        unmountOnExit
      >
        <Box
          sx={{
            position: "absolute",
            top: "5%",
            left: "1%",
            zIndex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "2%",
            borderRadius: 2,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "1%",
            width: isMobile ? "80%" : "20%",
          }}
        >
          <Typography
            variant="h6"
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <span>Community Size: {data.total_node_count}</span>
          </Typography>
          <TextField
            label="Limit"
            type="number"
            value={inputLimit}
            onChange={handleLimitChange}
            sx={{ marginBottom: 0.1 }}
          />
          <Typography variant="body1" sx={{ marginTop: 0.1 }}>
            Most Connected Nodes
          </Typography>
          <Button variant="contained" onClick={handleUpdateGraph}>
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
      <div ref={cyRef} style={{ width: "100%", height: "100%" }} />
      <LegendContainer>
        <Typography variant="body2" sx={{ marginRight: 2 }}>
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
      {selectedNode && (
        <Card
          sx={{
            position: "absolute",
            bottom: isMobile ? "22%" : "15%",
            right: "1%",
            width: commonWidth,
            zIndex: 2,
            maxHeight: "80%", // Restrict the height of the card
            overflowY: "auto", // Enable vertical scrolling if content exceeds max height
            overflowX: "auto", // Enable horizontal scrolling if content exceeds width
          }}
        >
          <CardContent>
            <Typography variant="h6">Node Information</Typography>
            {renderNodeInfo(selectedNode)}
            <IconButton
              aria-label="close"
              size="small"
              onClick={handleCloseCard}
              sx={{ position: "absolute", top: 5, right: 5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </CardContent>
        </Card>
      )}
      {selectedEdge &&
        selectedEdge.data("type") !== "transaction" &&
        renderEdgeCard(selectedEdge)}
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
            Number of transactions ={" "}
            {
              data.transaction_relations.filter(
                (relation) =>
                  relation.from_.value === selectedEdge.data("source") &&
                  relation.to.value === selectedEdge.data("target")
              ).length
            }
          </Typography>
          <IconButton
            aria-label="close"
            size="small"
            onClick={handleCloseCard}
            sx={{ position: "absolute", top: 5, right: 5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          {isTableVisible && (
            <TableContainer
              component={Paper}
              sx={{ width: "100%", overflowX: "auto" }} // Enables horizontal scrolling
            >
              <Table stickyHeader sx={{ minWidth: "80%" }}>
                {" "}
                {/* Set a minWidth to enable scrolling */}
                <TableHead>
                  <TableRow>
                    <TableCell>No.</TableCell>
                    <TableCell>Transaction Hash</TableCell>
                    <TableCell>NFT Identifier</TableCell>
                    <TableCell>NFT Collection</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.transaction_relations
                    .filter(
                      (relation) =>
                        relation.from_.value === selectedEdge.data("source") &&
                        relation.to.value === selectedEdge.data("target")
                    )
                    .map((relation, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <a
                            href={relation.relationship.link_etherscan}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {relation.relationship.property}
                          </a>
                        </TableCell>
                        <TableCell>
                          {relation.relationship.nft_identifier}
                        </TableCell>
                        <TableCell>
                          {mapNFTCollection(
                            relation.relationship.nft_collection
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SingleGraph;

"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import cytoscape, {
  Core,
  ElementDefinition,
  EventObject,
  NodeSingular,
  EdgeSingular,
} from "cytoscape";
import { SearchResult, Neighbor, Relationship } from "@/types/searchResult";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Collapse,
  useMediaQuery,
  useTheme,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";

const predefinedColors: { [key: string]: string } = {
  owned: "#FF851B",
  mint: "#2ECC40",
  "sale and transfer": "#0074D9",
  transfer: "#39CCCC",
  other: "#B10DC9",
};

const handleNodeMouseOver = (event: EventObject) => {
  const node = event.target as NodeSingular;
  console.log("Node hovered over:", node.data());
};

const handleNodeMouseOut = (event: EventObject) => {
  console.log("Node hover out:", event.target.data());
};

const handleEdgeMouseOver = (event: EventObject) => {
  const edge = event.target as EdgeSingular;
  console.log("Edge hovered over:", edge.data());
};

const handleEdgeMouseOut = (event: EventObject) => {
  console.log("Edge hover out:", event.target.data());
};

const getColorForType = (
  type: string,
  transactionEventType: string
): string => {
  return (
    predefinedColors[
      transactionEventType?.toLowerCase() || type.toLowerCase()
    ] || predefinedColors.other
  );
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const SearchGraph: React.FC<{ data: SearchResult }> = ({ data }) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const [edgeCounts, setEdgeCounts] = useState<{ [key: string]: number }>({});
  const [nodeCounts, setNodeCounts] = useState<{ [key: string]: number }>({});
  const [selectedNode, setSelectedNode] = useState<NodeSingular | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null);
  const [cyInstance, setCyInstance] = useState<Core | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [boxOpen, setBoxOpen] = useState(true); // State to control box visibility

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [nftImages, setNftImages] = useState<{ [key: string]: string | null }>({
    NFT_BoredApes: null,
    NFT_DeGods: null,
  });

  const getCytoscapeElements = useCallback(
    (data: SearchResult): ElementDefinition[] => {
      const elements: ElementDefinition[] = [];
      const mainNodeId = data.identifier || data.account;

      if (mainNodeId) {
        elements.push({
          data: {
            id: mainNodeId,
            label: mainNodeId,
            type: data.identifier ? "NFT" : "Account",
            collection: data.collection || "",
            image: data.image_url || "",
            target: true,
            link: data.opensea_url || data.link || "",
          },
        });
      }

      if (data.neighbors) {
        data.neighbors.forEach((neighbor: Neighbor) => {
          if (neighbor && neighbor.value) {
            elements.push({
              data: {
                id: neighbor.value,
                label: neighbor.value,
                type: neighbor.type,
                image: neighbor.image,
                collection: neighbor.collection || "",
                link: neighbor.link || "",
              },
            });
          }
        });
      }

      if (data.relationships) {
        data.relationships.forEach((relationship: Relationship) => {
          if (relationship.from_.value && relationship.to.value) {
            elements.push({
              data: {
                source: relationship.from_.value,
                target: relationship.to.value,
                label:
                  relationship.relationship.transaction_event_type ||
                  relationship.relationship.type,
                type: relationship.relationship.type,
                property: relationship.relationship.property,
                transaction_event_type:
                  relationship.relationship.transaction_event_type,
                nft_identifier: relationship.relationship.nft_identifier,
                nft_collection: relationship.relationship.nft_collection,
                link: relationship.relationship.link_etherscan || "",
              },
            });
          }
        });
      }

      return elements;
    },
    []
  );

  const elements = useMemo(
    () => getCytoscapeElements(data),
    [data, getCytoscapeElements]
  );

  useEffect(() => {
    if (!cyRef.current || !data) {
      console.error("cyRef.current is null or data is undefined");
      return;
    }

    if (!elements || elements.length === 0) {
      console.error("No elements found for Cytoscape");
      return;
    }

    const cy: Core = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#ffffff",
            "background-image": (ele: NodeSingular) => {
              const image = ele.data("image");
              return image ? `url(${image})` : "none";
            },
            "background-fit": "cover",
            "border-width": 2,
            "border-color": (ele: NodeSingular) => {
              const collection = ele.data("collection");
              if (collection === "boredapeyachtclub") return "#FF851B";
              if (collection === "degods-eth") return "#0074D9";
              return "#000000";
            },
            width: isMobile ? "30px" : "40px", // Adjusted for mobile
            height: isMobile ? "30px" : "40px", // Adjusted for mobile
            shape: "ellipse",
            "text-opacity": 0,
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-color": "red",
            "border-width": 4,
          },
        },
        {
          selector: "edge",
          style: {
            "line-color": (ele: EdgeSingular) => {
              const type = ele.data("type");
              const transactionEventType = ele.data("transaction_event_type");
              return getColorForType(type, transactionEventType);
            },
            "target-arrow-color": (ele: EdgeSingular) => {
              const type = ele.data("type");
              const transactionEventType = ele.data("transaction_event_type");
              return getColorForType(type, transactionEventType);
            },
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": isMobile ? 0.8 : 1, // Adjusted for mobile
            width: isMobile ? 1 : 2, // Adjusted for mobile
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "red",
            "target-arrow-color": "red",
            width: isMobile ? 2 : 3, // Adjusted for mobile
          },
        },
      ],
      layout: {
        name: "concentric",
        concentric: (node: NodeSingular) => node.degree(true),
        levelWidth: (nodes: any) => nodes.maxDegree(true) / 10,
        padding: 10,
        avoidOverlap: true,
        spacingFactor: 0.5,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autounselectify: true,
    });

    cy.on("layoutstop", null, () => {
      const centerId = data.account || data.identifier;
      if (centerId) {
        const centerNode = cy.getElementById(centerId);
        if (centerNode.length > 0) {
          cy.center(centerNode);
        }
      }
      cy.fit(); // Ensure the graph fits within the view
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

    cy.on("tap", "node", (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      cy.batch(() => {
        cy.nodes().removeClass("highlighted");
        cy.edges().removeClass("highlighted");
        node.addClass("highlighted");
      });

      setSelectedNode(node);
      setSelectedEdge(null);
    });

    cy.on("tap", "edge", (evt: EventObject) => {
      const edge = evt.target as EdgeSingular;
      cy.batch(() => {
        cy.nodes().removeClass("highlighted");
        cy.edges().removeClass("highlighted");
        edge.addClass("highlighted");
      });

      if (edge.data("type").toLowerCase() === "transacted") {
        const nftIdentifier = edge.data("nft_identifier");
        if (nftIdentifier) {
          const node = cy.getElementById(nftIdentifier);
          if (node) {
            node.addClass("highlighted");
          }
        }
      }

      setSelectedEdge(edge);
      setSelectedNode(null);
    });

    setCyInstance(cy);

    const floatNodes = () => {
      if (!cy || !isAnimating) return;

      const duration = 10000; // Duration of the animation in milliseconds for each node
      const amplitude = isMobile ? 0.1 : 0.2; // Movement distance adjusted for mobile
      const sizeAmplitude = isMobile ? 2 : 5; // Adjusted for mobile

      const nodes = cy.nodes();

      const animateNode = (
        node: NodeSingular,
        startTime: number,
        direction: { x: number; y: number },
        phase: number
      ) => {
        const animate = (timestamp: number) => {
          if (!isAnimating) return; // Stop animation if not animating

          const elapsedTime = timestamp - startTime;
          const progress = (elapsedTime % duration) / duration; // Normalized progress (0 to 1)
          const xOffset =
            amplitude * Math.sin(progress * Math.PI * 2 + phase) * direction.x;
          const yOffset =
            amplitude * Math.sin(progress * Math.PI * 2 + phase) * direction.y;

          const currentSizeChange =
            sizeAmplitude * Math.sin(progress * Math.PI * 2 + phase); // Size change along with movement

          const currentPosition = node.position();

          node.position({
            x: currentPosition.x + xOffset,
            y: currentPosition.y + yOffset,
          });

          // Update size using data attributes
          node.data("size", (isMobile ? 30 : 40) + currentSizeChange); // Adjusted for mobile

          requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      };

      nodes.forEach((node: NodeSingular) => {
        const startTime = performance.now();
        const direction = {
          x: Math.random() > 0.5 ? 1 : -1, // Randomly choose horizontal direction
          y: Math.random() > 0.5 ? 1 : -1, // Randomly choose vertical direction
        };
        const phase = Math.random() * Math.PI * 2; // Random phase for each node
        animateNode(node, startTime, direction, phase);
      });
    };

    // Start the continuous movement
    if (isAnimating) floatNodes();

    cy.style()
      .selector("node")
      .style({
        width: "data(size)",
        height: "data(size)",
      })
      .update();

    cy.fit(); // Ensure the graph fits within the view after starting the animation

    return () => {
      if (cy) {
        cy.destroy();
      }
    };
  }, [data, elements, isAnimating, isMobile]);

  useEffect(() => {
    if (!data.relationships) return;

    const edgeCounts: { [key: string]: number } = {};
    data.relationships.forEach((relationship) => {
      const transactionEventType =
        relationship.relationship.transaction_event_type ||
        relationship.relationship.type;

      if (transactionEventType) {
        edgeCounts[transactionEventType] =
          (edgeCounts[transactionEventType] || 0) + 1;
      }
    });

    setEdgeCounts(edgeCounts);

    const nodeCounts: { [key: string]: number } = {
      Account: 0,
      NFT_BoredApes: 0,
      NFT_DeGods: 0,
    };

    const targetId = data.identifier || data.account;
    let targetNodeType: string | null = null;

    elements.forEach((element) => {
      if (element.data?.id === targetId) {
        targetNodeType = element.data?.type;
      }
    });

    const nodeTypes = {
      Account: new Set(),
      NFT_BoredApes: new Set(),
      NFT_DeGods: new Set(),
    };

    elements.forEach((element) => {
      const type = element.data?.type;
      const collection = element.data?.collection;
      if (type === "Account") {
        nodeTypes.Account.add(element.data?.id);
      } else if (type === "NFT") {
        if (collection === "boredapeyachtclub") {
          nodeTypes.NFT_BoredApes.add(element.data?.id);
        } else if (collection === "degods-eth") {
          nodeTypes.NFT_DeGods.add(element.data?.id);
        }
      }
    });

    if (targetNodeType === "NFT") {
      if (data.collection === "boredapeyachtclub") {
        nodeTypes.NFT_BoredApes.add(targetId);
      } else if (data.collection === "degods-eth") {
        nodeTypes.NFT_DeGods.add(targetId);
      }
    } else if (targetNodeType === "Account") {
      nodeTypes.Account.add(targetId);
    }

    setNodeCounts({
      Account: nodeTypes.Account.size,
      NFT_BoredApes: nodeTypes.NFT_BoredApes.size,
      NFT_DeGods: nodeTypes.NFT_DeGods.size,
    });

    const nftImagesData = {
      NFT_BoredApes: getNftImageFromCollection("boredapeyachtclub", elements),
      NFT_DeGods: getNftImageFromCollection("degods-eth", elements),
    };
    setNftImages(nftImagesData);

    const popUpNFTImages = () => {
      elements.forEach((element) => {
        if (element.data?.type === "NFT") {
          const node = cyInstance?.getElementById(element.data?.id);
          if (node) {
            const imageUrl = element.data?.image;
            if (imageUrl) {
              const tooltip = (
                <Tooltip title={<img src={imageUrl} alt="NFT" />}>
                  <Box />
                </Tooltip>
              );
              setTimeout(() => {}, 2000);
            }
          }
        }
      });
    };

    const nftPopUpInterval = setInterval(popUpNFTImages, 5000);

    return () => {
      clearInterval(nftPopUpInterval);
    };
  }, [data, elements, cyInstance]);

  const getNftImageFromCollection = (
    collection: string,
    elements: ElementDefinition[]
  ): string | null => {
    const nftNode = elements.find(
      (element) =>
        element.data?.collection === collection && element.data?.image
    );
    return nftNode?.data?.image || null;
  };

  const handleCloseCard = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
    if (cyInstance) {
      cyInstance.nodes().removeClass("highlighted");
      cyInstance.edges().removeClass("highlighted");
    }
  };

  const mapNFTCollection = (collection: string) => {
    const collectionMap: { [key: string]: string } = {
      boredapeyachtclub: "BoredApes",
      degods: "DeGods",
    };
    return collectionMap[collection] || collection;
  };

  const handleCopy = (text: string) => {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy text using Clipboard API: ", err);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const getEdgeLabel = (
    type: string,
    property: string,
    link: string
  ): JSX.Element => {
    let labelText = "";

    switch (type.toLowerCase()) {
      case "owned":
        labelText = `Currently Owns: `;
        break;
      case "mint":
        labelText = `Mint At: `;
        break;
      case "transacted":
        labelText = `Transaction Hash: `;
        break;
      default:
        labelText = `${capitalizeFirstLetter(type)}: `;
        break;
    }

    return (
      <Typography variant="body2">
        {labelText}
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {property}
          </a>
        ) : (
          property
        )}
      </Typography>
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      <Button
        variant="contained"
        onClick={() => setIsAnimating(!isAnimating)}
        style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
      >
        {isAnimating ? "Stop Animation" : "Start Animation"}
      </Button>
      <div
        ref={cyRef}
        style={{ width: "100%", height: "100%", border: "1px solid #ccc" }}
      />
      <Button
        variant="contained"
        onClick={() => setBoxOpen(!boxOpen)} // Toggle the box visibility
        style={{
          position: "absolute",
          bottom: "2%", // Consistent bottom position
          left: boxOpen ? (isMobile ? "70%" : 420) : isMobile ? "70%" : 10, // Different left positions based on state
          transform: isMobile ? "translateX(-50%)" : "none",
          zIndex: 2,
          fontSize: "0.875rem", // Consistent font size
          padding: "6px 16px", // Consistent padding
          minWidth: "64px", // Consistent min-width
          lineHeight: "1.75", // Consistent line height
          backgroundColor: "#1976d2", // Consistent background color
          color: "#fff", // Consistent text color
          boxShadow:
            "0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)", // Consistent box shadow
          textTransform: "uppercase", // Consistent text transformation
        }}
      >
        {boxOpen ? "Hide Details" : "Show Details"}
      </Button>

      <Collapse in={boxOpen}>
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            left: 10,
            zIndex: 1,
            display: "flex",
            gap: 2,
            backgroundColor: "white",
            padding: 2,
            borderRadius: 2,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            flexDirection: isMobile ? "column" : "row",
            width: isMobile ? "90%" : "auto",
          }}
        >
          <Box
            sx={{
              backgroundColor: "white",
              padding: 2,
              borderRadius: 2,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              width: 200,
            }}
          >
            <Typography variant="h6">Node</Typography>

            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    border: "1px solid #000",
                    marginRight: 1,
                  }}
                />
                <Typography variant="body2">
                  Account: {nodeCounts.Account}
                </Typography>
              </Box>
              {nodeCounts.NFT_BoredApes > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      border: "1px solid #FF851B",
                      backgroundImage: nftImages.NFT_BoredApes
                        ? `url(${nftImages.NFT_BoredApes})`
                        : "none",
                      backgroundSize: "cover",
                      marginRight: 1,
                    }}
                  />
                  <Typography variant="body2">
                    NFT_BoredApes: {nodeCounts.NFT_BoredApes}
                  </Typography>
                </Box>
              )}
              {nodeCounts.NFT_DeGods > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      border: "1px solid #0074D9",
                      backgroundImage: nftImages.NFT_DeGods
                        ? `url(${nftImages.NFT_DeGods})`
                        : "none",
                      backgroundSize: "cover",
                      marginRight: 1,
                    }}
                  />
                  <Typography variant="body2">
                    NFT_DeGods: {nodeCounts.NFT_DeGods}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: "white",
              padding: 2,
              borderRadius: 2,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              width: 150,
            }}
          >
            <Typography variant="h6">Edge</Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {Object.entries(edgeCounts).map(([type, count]) => (
                <Box
                  key={type}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderBottom: `20px solid ${getColorForType(type, "")}`,
                      marginRight: 1,
                    }}
                  />
                  <Typography variant="body2">
                    {capitalizeFirstLetter(type)}: {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
      {selectedNode && (
        <Card
          sx={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: isMobile ? "90%" : 400,
            zIndex: 2,
            maxHeight: "85%", // Restrict the height of the card
            overflowY: "auto", // Enable scrolling if content exceeds max height
            overflowX: "auto", // Enable horizontal scrolling if content exceeds width
          }}
        >
          <CardContent>
            <Typography variant="h6">Node Information</Typography>

            <Box sx={{ display: "flex", alignItems: "center" }}></Box>
            <Typography variant="body2">
              Value: {selectedNode.data("id")}
              <Tooltip title="Copy">
                <IconButton
                  onClick={() => handleCopy(selectedNode.data("id"))}
                  aria-label="copy"
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            {selectedNode.data("link") && (
              <Typography variant="body2">
                Link:{" "}
                <a
                  href={selectedNode.data("link")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedNode.data("type") === "NFT"
                    ? "View on Opensea"
                    : "View on Etherscan"}
                </a>
              </Typography>
            )}

            {selectedNode.data("collection") && (
              <Typography variant="body2">
                Collection: {mapNFTCollection(selectedNode.data("collection"))}
              </Typography>
            )}
            <Typography variant="body2">
              Type: {selectedNode.data("type")}
            </Typography>
            {selectedNode.data("type") === "NFT" &&
              selectedNode.data("image") && (
                <img
                  src={selectedNode.data("image")}
                  alt="NFT"
                  style={{
                    width: "100%",
                    height: "auto",
                    marginBottom: 16,
                    borderRadius: 8,
                  }}
                />
              )}
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
      {selectedEdge && (
        <Card
          sx={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: isMobile ? "90%" : 400,
            zIndex: 2,
            overflowX: "auto", // Enable horizontal scrolling if content exceeds width
          }}
        >
          <CardContent>
            <Typography variant="h6">Edge Information</Typography>
            <Typography variant="body2">
              Source: {selectedEdge.data("source")}
              <Tooltip title="Copy">
                <IconButton
                  onClick={() => handleCopy(selectedEdge.data("source"))}
                  aria-label="copy"
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Typography variant="body2">
              Target: {selectedEdge.data("target")}
              <Tooltip title="Copy">
                <IconButton
                  onClick={() => handleCopy(selectedEdge.data("target"))}
                  aria-label="copy"
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            {selectedEdge.data("type") &&
              getEdgeLabel(
                selectedEdge.data("type"),
                selectedEdge.data("property"),
                selectedEdge.data("link")
              )}
            {selectedEdge.data("nft_identifier") && (
              <Typography variant="body2">
                NFT Identifier: {selectedEdge.data("nft_identifier")}
              </Typography>
            )}
            {selectedEdge.data("nft_collection") && (
              <Typography variant="body2">
                NFT Collection:{" "}
                {mapNFTCollection(selectedEdge.data("nft_collection") || "")}
              </Typography>
            )}
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
    </div>
  );
};

export default SearchGraph;

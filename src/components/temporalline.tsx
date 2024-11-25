import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
  CircularProgress,
  SelectChangeEvent,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

interface ApiResponse {
  dates: string[];
  counts: number[];
}

interface DataSet {
  dates: string[];
  counts: number[];
  label: string;
}

interface TemporalLineProps {
  endpointType: string;
  yearFrom: number;
  yearTo: number;
  monthFrom: number;
  monthTo: number;
  collection: string[];
  relationType: string[];
  onParametersChange: (params: {
    endpointType: string;
    yearFrom: number;
    yearTo: number;
    monthFrom: number;
    monthTo: number;
    collection: string[];
    relationType: string[];
  }) => void;
}

export default function TemporalLine({
  endpointType,
  yearFrom,
  yearTo,
  monthFrom,
  monthTo,
  collection,
  relationType,
  onParametersChange,
}: TemporalLineProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [dataSets, setDataSets] = useState<DataSet[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultCollection =
    endpointType === "transaction"
      ? ["BoredApes"]
      : collection.length > 0
      ? collection
      : ["BoredApes"];
  const defaultRelationType =
    endpointType === "active_user" ? ["transacted", "mint"] : [];

  const [selectedCollection, setSelectedCollection] =
    useState<string[]>(defaultCollection);
  const [selectedRelationType, setSelectedRelationType] =
    useState<string[]>(defaultRelationType);

  const [yearFromState, setYearFrom] = useState<number>(yearFrom || 2024);
  const [yearToState, setYearTo] = useState<number>(yearTo || 2024);
  const [monthFromState, setMonthFrom] = useState<number>(monthFrom || 3);
  const [monthToState, setMonthTo] = useState<number>(monthTo || 4);

  const [currentEndpointType, setCurrentEndpointType] =
    useState<string>(endpointType);

  const collectionOptions = ["BoredApes", "Degods"];
  const relationTypeOptions = ["transacted", "mint"];

  const endpointTypeMapping: Record<
    "transaction" | "mint" | "active_user",
    string
  > = {
    transaction: "Number of Transactions",
    mint: "Number of Minted NFT",
    active_user: "Active User",
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        endpoint_type: currentEndpointType || "transaction",
        year_from: yearFromState.toString(),
        year_to: yearToState.toString(),
        month_from: monthFromState.toString(),
        month_to: monthToState.toString(),
      });

      selectedCollection.forEach((col) =>
        queryParams.append("collection", col.toLowerCase())
      );

      if (currentEndpointType === "active_user") {
        selectedRelationType.forEach((relType) =>
          queryParams.append("relation_type", relType)
        );
      }

      const url = `/api/temporalline?${queryParams.toString()}`;
      console.log("Fetching data from URL:", url);

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const result = await res.json();
      console.log("API Response:", result);

      if (currentEndpointType === "active_user") {
        if (Array.isArray(result) && result.length > 0) {
          const fetchedDataSets = result.map((item) => ({
            dates: item.data.dates,
            counts: item.data.counts,
            label: `${endpointTypeMapping[currentEndpointType]} - ${item.relation_type}`,
          }));
          setDataSets(fetchedDataSets);
        } else {
          console.warn("Unexpected data format for result:", result);
          setDataSets([]);
        }
      } else {
        if (Array.isArray(result) && result.length === 1) {
          const item = result[0];
          setDataSets([
            {
              dates: item.dates,
              counts: item.counts,
              label:
                endpointTypeMapping[
                  currentEndpointType as keyof typeof endpointTypeMapping
                ],
            },
          ]);
        } else if (result.dates && result.counts) {
          setDataSets([
            {
              dates: result.dates,
              counts: result.counts,
              label:
                endpointTypeMapping[
                  currentEndpointType as keyof typeof endpointTypeMapping
                ],
            },
          ]);
        } else {
          console.warn("Unexpected data format for result:", result);
          setDataSets([]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setDataSets([]);
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch data when endpointType changes
  useEffect(() => {
    fetchData();
  }, [currentEndpointType]);

  const handleYearFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYearFrom(Number(event.target.value));
  };

  const handleYearToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYearTo(Number(event.target.value));
  };

  const handleMonthFromChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = Number(event.target.value);
    if (value > 12) value = 1;
    else if (value < 1) value = 12;
    setMonthFrom(value);
  };

  const handleMonthToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(event.target.value);
    if (value > 12) value = 1;
    else if (value < 1) value = 12;
    setMonthTo(value);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const newEndpointType = event.target.value;

    if (newEndpointType === "active_user") {
      setSelectedRelationType(["transacted", "mint"]);
    } else {
      setSelectedRelationType([]);
    }

    setCurrentEndpointType(newEndpointType);

    onParametersChange({
      endpointType: newEndpointType,
      yearFrom: yearFromState,
      yearTo: yearToState,
      monthFrom: monthFromState,
      monthTo: monthToState,
      collection: selectedCollection,
      relationType:
        newEndpointType === "active_user" ? ["transacted", "mint"] : [],
    });
  };

  const handleCollectionChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newSelectedCollection =
      typeof value === "string" ? value.split(",") : value;

    const uniqueCollection = Array.from(new Set(newSelectedCollection));

    setSelectedCollection(uniqueCollection);

    onParametersChange({
      endpointType: currentEndpointType,
      yearFrom: yearFromState,
      yearTo: yearToState,
      monthFrom: monthFromState,
      monthTo: monthToState,
      collection: uniqueCollection,
      relationType: selectedRelationType,
    });
  };

  const handleRelationTypeChange = (event: SelectChangeEvent<string[]>) => {
    const newSelectedRelationType =
      typeof event.target.value === "string"
        ? event.target.value.split(",")
        : event.target.value;
    setSelectedRelationType(newSelectedRelationType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(); // Manually trigger fetchData on button click
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (dataSets.length === 0) {
    return <Typography>No data available</Typography>;
  }

  const containerWidth = isMobile ? 300 : 1320; // Set a fixed numeric width

  return (
    <Box sx={{ width: "100%", padding: 2 }}>
      <Box sx={{ marginBottom: 2, textAlign: isMobile ? "center" : "left" }}>
        <Select
          value={currentEndpointType}
          onChange={handleSelectChange}
          displayEmpty
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="transaction">Number of Transactions</MenuItem>
          <MenuItem value="mint">Number of Minted NFT</MenuItem>
          <MenuItem value="active_user">Active User</MenuItem>
        </Select>
      </Box>

      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 1,
          padding: 2,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%", // Ensures the container takes full width
          maxWidth: "1400px", // Cap the max width for large screens
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <FormControl fullWidth sx={{ flex: "1 1 0", minWidth: 200 }}>
            <InputLabel sx={{ backgroundColor: "white", padding: "0 8px" }}>
              Collection
            </InputLabel>
            <Select
              multiple
              value={selectedCollection}
              onChange={handleCollectionChange}
              renderValue={(selected) =>
                selected
                  .map((item) =>
                    item
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join("")
                  )
                  .join(", ")
              }
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 224,
                    width: 200,
                  },
                },
              }}
            >
              {collectionOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  <Checkbox checked={selectedCollection.includes(option)} />
                  <ListItemText primary={option} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Year From"
            type="number"
            name="yearFrom"
            value={yearFromState}
            onChange={handleYearFromChange}
            sx={{ flex: "1 1 0", minWidth: 100 }}
          />

          <TextField
            fullWidth
            label="Year To"
            type="number"
            name="yearTo"
            value={yearToState}
            onChange={handleYearToChange}
            sx={{ flex: "1 1 0", minWidth: 100 }}
          />

          <TextField
            fullWidth
            label="Month From"
            type="number"
            name="monthFrom"
            value={monthFromState}
            onChange={handleMonthFromChange}
            sx={{ flex: "1 1 0", minWidth: 100 }}
          />

          <TextField
            fullWidth
            label="Month To"
            type="number"
            name="monthTo"
            value={monthToState}
            onChange={handleMonthToChange}
            sx={{ flex: "1 1 0", minWidth: 100 }}
          />

          {currentEndpointType === "active_user" && (
            <FormControl fullWidth sx={{ flex: "1 1 0", minWidth: 200 }}>
              <InputLabel id="relation-type-label">Relation Type</InputLabel>
              <Select
                labelId="relation-type-label"
                multiple
                value={selectedRelationType}
                onChange={handleRelationTypeChange}
                input={<OutlinedInput label="Relation Type" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                      width: 200,
                    },
                  },
                }}
              >
                {relationTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    <Checkbox checked={selectedRelationType.includes(option)} />
                    <ListItemText primary={option} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              height: isMobile ? "auto" : "100%",
              minWidth: 120,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Update Chart
          </Button>
        </Box>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <LineChart
            xAxis={[
              {
                data: dataSets[0]?.dates || [],
                scaleType: "band",
              },
            ]}
            series={dataSets.map((dataset) => ({
              data: dataset.counts,
              label: dataset.label,
            }))}
            width={containerWidth} // Pass as a number
            height={400}
            margin={{ left: 50, right: 30, top: 50, bottom: 30 }}
            grid={{ vertical: true, horizontal: true }}
          />
        </Box>
      </Box>
    </Box>
  );
}

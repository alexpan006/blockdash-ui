import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Tooltip as MuiTooltip,
  Checkbox,
  ListItemText,
  useMediaQuery,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { BarChart } from "@mui/x-charts/BarChart";
import axios from "axios";
import { getLogger } from "../../util/logging/log-util";

interface ApiResponse {
  dates?: string[];
  counts?: number[];
  overall_score?: number;
}

interface BarDataSet {
  labels: string[];
  data: (number | null)[];
  label: string;
  color: string;
}

const logger = getLogger("ginibar");

export default function GiniBarChart() {
  const [overallData, setOverallData] = useState<{ [key: string]: number }>({});
  const [singleTypeData, setSingleTypeData] = useState<BarDataSet[]>([]);
  const [loading, setLoading] = useState(false);

  const [yearFrom, setYearFrom] = useState<number>(2023);
  const [yearTo, setYearTo] = useState<number>(2023);
  const [monthFrom, setMonthFrom] = useState<number>(5);
  const [monthTo, setMonthTo] = useState<number>(12);
  const [selectedCollection, setSelectedCollection] =
    useState<string>("BoredApes");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const collectionOptions = ["BoredApes", "Degods"];
  const relationTypeOptionsOverall = ["transacted", "mint"];
  const relationTypeOptionsSingleType = ["transacted", "mint", "owned"];

  const [relationTypes, setRelationTypes] = useState<string[]>(
    relationTypeOptionsSingleType
  );

  const handleRelationTypesChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setRelationTypes(typeof value === "string" ? value.split(",") : value);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        year_from: yearFrom.toString(),
        year_to: yearTo.toString(),
        month_from: monthFrom.toString(),
        month_to: monthTo.toString(),
        collection: selectedCollection.toLowerCase(),
      });

      const overallResponses = await Promise.all(
        relationTypeOptionsOverall.map(async (relationType) => {
          const overallUrl = `/api/ginibar/overall?${queryParams.toString()}&relation_type=${relationType}`;
          const response = await axios.get<ApiResponse>(overallUrl);
          const score =
            typeof response.data === "number"
              ? response.data
              : response.data.overall_score;
          return {
            relationType,
            score: score !== undefined ? score : null,
          };
        })
      );

      const overallDataObject = overallResponses.reduce(
        (acc, { relationType, score }) => ({
          ...acc,
          [relationType]: score,
        }),
        {}
      );

      setOverallData(overallDataObject);

      const singleTypeResponses = await Promise.all(
        relationTypes.map(async (relationType) => {
          const singleTypeUrl = `/api/ginibar/singletype?${queryParams.toString()}&relation_type=${relationType}`;
          const response = await axios.get<ApiResponse>(singleTypeUrl);
          if (response.data.dates && response.data.counts) {
            const mappedData = response.data.counts.map((count) =>
              count === -1 ? null : count
            );
            return {
              labels: response.data.dates,
              data: mappedData,
              label: `Relation Type - ${relationType}`,
              color:
                relationType === "transacted"
                  ? "#FF5733"
                  : relationType === "mint"
                  ? "#33FF57"
                  : "#3357FF",
            };
          } else {
            console.warn("Single type data is missing expected fields");
            return null;
          }
        })
      );

      setSingleTypeData(singleTypeResponses.filter(Boolean) as BarDataSet[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setOverallData({});
      setSingleTypeData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    if (value > 12) value = 12;
    else if (value < 1) value = 1;
    setMonthFrom(value);
  };

  const handleMonthToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(event.target.value);
    if (value > 12) value = 12;
    else if (value < 1) value = 1;
    setMonthTo(value);
  };

  const handleCollectionChange = (event: SelectChangeEvent<string>) => {
    setSelectedCollection(event.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(); // Fetch data based on the current input parameters
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

  const chartWidth = isMobile ? 350 : 1350;
  const containerWidth = chartWidth + 40;
  

  // Prepare series data
  const seriesData = singleTypeData.map(({ label, color, data }) => ({
    label,
    data,
    color,
  }));

  return (
    <Box sx={{ width: containerWidth, padding: 2, margin: "0 auto" }}>
      <Box
        sx={{
          width: "100%",
          textAlign: "left",
          marginBottom: 2,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="h2">
          Gini Coefficient
        </Typography>
        {!isMobile && ( // Disable InfoIcon on mobile screens
          <MuiTooltip
            title={
              <Box sx={{ textAlign: "justify" }}>
                <Typography variant="body2">
                  The Gini coefficient is a measure of statistical dispersion
                  intended to represent the asset inequality possessed within a
                  concerned group. A Gini coefficient of 0 expresses perfect
                  equality, a Gini coefficient of 1 expresses maximal
                  inequality.
                </Typography>
                <Typography variant="body2">
                  Considering transactions, the Gini coefficient gives insights
                  into the inequality of transaction activity among Owners. For
                  the ownership relation it gives a measure of inequality in the
                  NFT ownership and for the mint events it measures the
                  inequality in the creation of NFTs among Owners.
                </Typography>
                <Typography variant="body2">
                  Note: if the Gini coefficient doesn’t exist that’s because
                  there were no relationships of the specific type in the chosen
                  timeframe to calculate the score.
                </Typography>
              </Box>
            }
            placement="right"
          >
            <InfoIcon sx={{ ml: 1, cursor: "pointer" }} />
          </MuiTooltip>
        )}
      </Box>
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 1,
          padding: 2,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          component="form"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            width: "100%",
            justifyContent: "space-between",
            mb: 3,
            flexDirection: isMobile ? "column" : "row",
          }}
          onSubmit={handleSubmit}
        >
          <FormControl sx={{ minWidth: isMobile ? "100%" : "10%" }}>
            <InputLabel>Collection</InputLabel>
            <Select
              value={selectedCollection}
              onChange={handleCollectionChange}
              input={<OutlinedInput label="Collection" />}
            >
              {collectionOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Year From"
            type="number"
            value={yearFrom}
            onChange={handleYearFromChange}
            sx={{ minWidth: isMobile ? "100%" : "10%" }}
          />

          <TextField
            label="Year To"
            type="number"
            value={yearTo}
            onChange={handleYearToChange}
            sx={{ minWidth: isMobile ? "100%" : "10%" }}
          />

          <TextField
            label="Month From"
            type="number"
            value={monthFrom}
            onChange={handleMonthFromChange}
            sx={{ minWidth: isMobile ? "100%" : "10%" }}
          />

          <TextField
            label="Month To"
            type="number"
            value={monthTo}
            onChange={handleMonthToChange}
            sx={{ minWidth: isMobile ? "100%" : "10%" }}
          />

          <FormControl sx={{ minWidth: isMobile ? "100%" : "20%" }}>
            <InputLabel>Relation Types</InputLabel>
            <Select
              multiple
              value={relationTypes}
              onChange={handleRelationTypesChange}
              input={<OutlinedInput label="Relation Types" />}
              renderValue={(selected) => selected.join(", ")}
            >
              {relationTypeOptionsSingleType.map((type) => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={relationTypes.indexOf(type) > -1} />
                  <ListItemText primary={type} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            type="submit"
            sx={{
              height: "auto",
              minWidth: isMobile ? "100%" : "15%",
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
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {relationTypeOptionsOverall.map((relationType) => (
            <Typography key={relationType} variant="body1">
              Overall -{" "}
              {relationType.charAt(0).toUpperCase() + relationType.slice(1)}:{" "}
              {overallData[relationType] === -1
                ? "N/A"
                : overallData[relationType] !== undefined
                ? overallData[relationType]
                : "N/A"}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center", // Center the BarChart horizontally
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          {singleTypeData.length > 0 ? (
            <Box sx={{ width: "100%", maxWidth: isMobile ? "100%" : "100%" }}>
              <BarChart
                xAxis={[
                  {
                    data: singleTypeData[0].labels,
                    scaleType: "band",
                    label: "Month",
                  },
                ]}
                series={seriesData}
                height={isMobile ? 200 : 300}
                width={isMobile ? 350 : 1350} // Make width fully responsive
              />
            </Box>
          ) : (
            <Typography>No data available</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

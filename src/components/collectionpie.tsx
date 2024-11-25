import React, { useState, useEffect } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const CollectionPie = () => {
  const [data, setData] = useState<
    { id: number; value: number; label: string }[]
  >([]);

  const [yearFrom, setYearFrom] = useState("2024");
  const [yearTo, setYearTo] = useState("2024");
  const [monthFrom, setMonthFrom] = useState("3");
  const [monthTo, setMonthTo] = useState("4");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleYearFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYearFrom(event.target.value);
  };

  const handleYearToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYearTo(event.target.value);
  };

  const handleMonthFromChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMonthFrom(event.target.value);
  };

  const handleMonthToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMonthTo(event.target.value);
  };

  const handleSubmit = () => {
    fetchData();
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        `/api/collectionpie?year_from=${yearFrom}&year_to=${yearTo}&month_from=${monthFrom}&month_to=${monthTo}`
      );
      const result = await response.json();

      const chartData = result.collections.map(
        (collection: string, index: number) => {
          let label = collection;

          if (collection === "degods-eth") {
            label = "Degods";
          } else if (collection === "boredapeyachtclub") {
            label = "BoredApes";
          }

          return {
            id: index,
            value: result.counts[index],
            label: label,
          };
        }
      );

      setData(chartData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ width: "100%", padding: { xs: 1, sm: 2 } }}>
      <Box
        sx={{
          width: "100%", // Take full width of the parent container
          textAlign: "left", // Align text to the left
          marginBottom: 2, // Add some space below the heading
        }}
      >
        <Typography variant="h6" component="h2">
          Collection Distribution for the Number of Transactions and Mint Events
        </Typography>
      </Box>
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 1,
          padding: { xs: 2, sm: 3 },
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
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
          <TextField
            fullWidth
            label="Year From"
            type="number"
            name="yearFrom"
            value={yearFrom}
            onChange={handleYearFromChange}
            sx={{ flex: "1 1 0", minWidth: 100 }}
          />

          <TextField
            fullWidth
            label="Year To"
            type="number"
            name="yearTo"
            value={yearTo}
            onChange={handleYearToChange}
            sx={{ flex: "1 1 0", minWidth: 100 }}
          />

          <TextField
            fullWidth
            label="Month From"
            type="number"
            name="monthFrom"
            value={monthFrom}
            onChange={handleMonthFromChange}
            sx={{ flex: "1 1 0", minWidth: 100 }}
          />

          <TextField
            fullWidth
            label="Month To"
            type="number"
            name="monthTo"
            value={monthTo}
            onChange={handleMonthToChange}
            sx={{ flex: "1 1 0", minWidth: 100 }}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              height: isMobile ? "auto" : "40px", // Smaller height and responsive on mobile
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
            marginTop: 2,
          }}
        >
          {data.length > 0 ? (
            <PieChart
              series={[
                {
                  data: data,
                },
              ]}
              width={isMobile ? 300 : 400} // Responsive width
              height={isMobile ? 150 : 200} // Responsive height
            />
          ) : (
            <p>No data available</p>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CollectionPie;

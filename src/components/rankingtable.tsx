import React, { useState, useEffect } from "react";
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  TextField,
  Box,
  CircularProgress,
  Typography,
  Checkbox,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface RankingItem {
  identifier: string;
  count: number;
}

const RankingTable: React.FC = () => {
  const [scope, setScope] = useState<string>("account_transaction");
  const [collection, setCollection] = useState<string[]>(["BoredApes"]);
  const [limit, setLimit] = useState<number>(1000);
  const [yearFrom, setYearFrom] = useState<number>(2024);
  const [yearTo, setYearTo] = useState<number>(2024);
  const [monthFrom, setMonthFrom] = useState<number>(1);
  const [monthTo, setMonthTo] = useState<number>(12);

  const [data, setData] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isHorizontal = useMediaQuery("(orientation: landscape)");

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Rank",
      flex: isMobile ? 0 : 1,
      minWidth: isMobile ? 120 : undefined,
    },
    {
      field: "identifier",
      headerName: "ID",
      flex: isMobile ? 1 : 3,
      minWidth: isMobile ? 100 : undefined,
    },
    {
      field: "count",
      headerName: "Count",
      type: "number",
      flex: isMobile ? 0 : 1,
      minWidth: isMobile ? 120 : undefined,
    },
  ];

  const collectionDisplayToValue: Record<string, string> = {
    BoredApes: "boredapes",
    DeGods: "degods",
  };

  const collectionValueToDisplay: Record<string, string> = {
    boredapes: "BoredApes",
    degods: "DeGods",
  };

  const handleScopeChange = (event: SelectChangeEvent<string>) => {
    setScope(event.target.value);
    if (event.target.value === "ownership_changes") {
      setCollection(["BoredApes"]); // Reset to default single choice
    }
  };

  const handleCollectionChange = (
    event: SelectChangeEvent<string[] | string>
  ) => {
    if (typeof event.target.value === "string") {
      setCollection([event.target.value]);
    } else {
      setCollection(event.target.value as string[]);
    }
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(Number(event.target.value));
  };

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

  const handleSubmit = async () => {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      year_from: yearFrom.toString(),
      year_to: yearTo.toString(),
      month_from: monthFrom.toString(),
      month_to: monthTo.toString(),
    });

    const collectionParam = collection
      .map((col) => collectionDisplayToValue[col])
      .join("&collection=");
    const url = `/api/rankingtable?scope=${scope}&collection=${collectionParam}&${queryParams.toString()}`;

    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("API Response:", result);
      if (Array.isArray(result.ranking)) {
        setData(result.ranking);
      } else {
        setData([]);
        setError("Unexpected API response format");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const defaultParams = {
        scope: "account_transaction",
        collection: "boredapes",
        limit: "1000",
        year_from: "2024",
        year_to: "2024",
        month_from: "1",
        month_to: "12",
      };
      const queryParams = new URLSearchParams(defaultParams).toString();
      try {
        setLoading(true);
        const response = await fetch(`/api/rankingtable?${queryParams}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("API Response:", result);
        if (Array.isArray(result.ranking)) {
          setData(result.ranking);
        } else {
          setData([]);
          setError("Unexpected API response format");
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const rows = data.map((item, index) => ({
    id: index + 1,
    identifier: item.identifier,
    count: item.count,
  }));

  const handleExportCSV = () => {
    const scopeDisplayMap: Record<string, string> = {
      account_transaction:
        "Account Transaction: rank accounts based on transaction-volume",
      concentration_ownership:
        "Concentration Ownership: rank accounts based on their number of currently owned NFT",
      contribution:
        "Contribution: rank accounts based on their contribution for a collection (how many NFT they minted)",
      ownership_changes:
        "Ownership Changes: rank NFT based on the amount of ownership changes",
    };

    const csvRows = [
      ["Scope", scopeDisplayMap[scope] || scope], // Map the scope to its display text
      ["Collection", collection.join(", ")],
      ["Limit", limit],
      ["Year From", yearFrom],
      ["Year To", yearTo],
      ["Month From", monthFrom],
      ["Month To", monthTo],
      [],
      ["Rank", "ID", "Count"],
      ...rows.map((row) => [row.id, row.identifier, row.count]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((row) => row.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ranking_data.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link); // Clean up
  };

  return (
    <Box
      sx={{
        padding: 0,
        width: "100vw",
        mx: "auto",
      }}
    >
      <Typography variant="h6" component="h2">
        Owner/NFT Ranking
      </Typography>
      <Box sx={{ mb: 2, width: "100%", mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 2, minWidth: 240 }}>
          <InputLabel sx={{ backgroundColor: "white", padding: "0 8px" }}>
            Scope
          </InputLabel>
          <Select
            value={scope}
            onChange={handleScopeChange}
            MenuProps={{ PaperProps: { style: { maxWidth: "100%" } } }}
          >
            <MenuItem value="account_transaction">
              <Box sx={{ whiteSpace: "nowrap", overflow: "auto" }}>
                Account Transaction: rank accounts based on transaction-volume
              </Box>
            </MenuItem>
            <MenuItem value="concentration_ownership">
              <Box sx={{ whiteSpace: "nowrap", overflow: "auto" }}>
                Concentration Ownership: rank accounts based on their number of
                currently owned NFT
              </Box>
            </MenuItem>
            <MenuItem value="contribution">
              <Box sx={{ whiteSpace: "nowrap", overflow: "auto" }}>
                Contribution: rank accounts based on their contribution for a
                collection (how many NFT they minted)
              </Box>
            </MenuItem>
            <MenuItem value="ownership_changes">
              <Box sx={{ whiteSpace: "nowrap", overflow: "auto" }}>
                Ownership Changes: rank NFT based on the amount of ownership
                changes
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          width: "100%",
          alignItems: "center",
          flexDirection: isMobile && !isHorizontal ? "column" : "row",
        }}
      >
        <FormControl fullWidth sx={{ flex: "1 1 0", minWidth: 240 }}>
          <InputLabel sx={{ backgroundColor: "white", padding: "0 8px" }}>
            Collection
          </InputLabel>
          {scope === "ownership_changes" ? (
            <Select
              value={collection[0]}
              onChange={handleCollectionChange}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 224,
                    width: 250,
                  },
                },
              }}
            >
              {Object.keys(collectionDisplayToValue).map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Select
              multiple
              value={collection}
              onChange={handleCollectionChange}
              renderValue={(selected) =>
                (selected as string[])
                  .map(
                    (col) =>
                      collectionValueToDisplay[collectionDisplayToValue[col]]
                  )
                  .join(", ")
              }
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 224,
                    width: 250,
                  },
                },
              }}
            >
              {Object.keys(collectionDisplayToValue).map((key) => (
                <MenuItem key={key} value={key}>
                  <Checkbox checked={collection.includes(key)} />
                  <ListItemText primary={key} />
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>
        <TextField
          fullWidth
          label="Limit"
          type="number"
          value={limit}
          onChange={handleLimitChange}
          sx={{ flex: "1 1 0", minWidth: 100 }}
        />
        <TextField
          fullWidth
          label="Year From"
          type="number"
          value={yearFrom}
          onChange={handleYearFromChange}
          sx={{ flex: "1 1 0", minWidth: 100 }}
        />
        <TextField
          fullWidth
          label="Year To"
          type="number"
          value={yearTo}
          onChange={handleYearToChange}
          sx={{ flex: "1 1 0", minWidth: 100 }}
        />
        <TextField
          fullWidth
          label="Month From"
          type="number"
          value={monthFrom}
          onChange={handleMonthFromChange}
          sx={{ flex: "1 1 0", minWidth: 100 }}
        />
        <TextField
          fullWidth
          label="Month To"
          type="number"
          value={monthTo}
          onChange={handleMonthToChange}
          sx={{ flex: "1 1 0", minWidth: 100 }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            height: "100%",
            minWidth: 120,
            flexShrink: 0,
          }}
        >
          Update Ranking
        </Button>
        <Button
          variant="outlined"
          onClick={handleExportCSV}
          sx={{
            height: "100%",
            minWidth: 120,
            flexShrink: 0,
          }}
        >
          Export as CSV
        </Button>
      </Box>

      <Box sx={{ width: "100%", mt: 4 }}>
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="h6">Error: {error}</Typography>
          </Box>
        )}

        {!loading && !error && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 100 },
                },
              }}
              pageSizeOptions={[100]}
              autoHeight
              sx={{ width: "100%" }}
            />
          </div>
        )}
      </Box>
    </Box>
  );
};

export default RankingTable;

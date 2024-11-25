import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import { styled, alpha, Theme, useTheme } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import {
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  SelectChangeEvent,
  useMediaQuery,
} from "@mui/material";
import { useRouter } from "next/navigation";

const Search = styled("div")<{ visible: boolean }>(({ theme, visible }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: visible
    ? alpha(theme.palette.common.white, 0.15)
    : "transparent",
  "&:hover": {
    backgroundColor: visible
      ? alpha(theme.palette.common.white, 0.25)
      : "transparent",
  },
  marginRight: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  width: visible ? "100%" : "auto", // Adjust width based on visibility
}));

const SearchIconWrapper = styled("div")(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
}));

const StyledInputBase = styled(InputBase)(({ theme }: { theme: Theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 2),
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "41ch",
    },
  },
}));

export default function SearchComponent() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [searchType, setSearchType] = useState<string>("Account");
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [nftSearch, setNftSearch] = useState<string>("");
  const [collection, setCollection] = useState<string>("boredapes");
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);

  const handleAccountInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAccountSearch(event.target.value);
  };

  const handleNftInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNftSearch(event.target.value);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      navigateToResults();
    }
  };

  const handleSearchTypeChange = (event: SelectChangeEvent<string>) => {
    setSearchType(event.target.value as string);
    setAccountSearch("");
    setNftSearch("");
    setCollection("boredapes");
  };

  const handleCollectionChange = (event: SelectChangeEvent<string>) => {
    setCollection(event.target.value as string);
  };

  const handleSearchIconClick = () => {
    if (!isSearchVisible) {
      setIsSearchVisible(true); // Show search inputs on click
    } else {
      navigateToResults(); // Navigate if search is already visible
    }
  };

  const navigateToResults = () => {
    const query = searchType === "Account" ? accountSearch : nftSearch;
    let url = `/searchresults?searchType=${searchType}&query=${query}`;
    if (searchType === "NFT") {
      url += `&collection=${collection}`;
    }
    console.log("Navigating to URL:", url);
    router.push(url);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexDirection: isMobile ? "column" : "row",
        width: "100%",
      }}
    >
      {/* Display search type and collection inputs only if search is visible */}
      {isSearchVisible && (
        <>
          <FormControl
            variant="outlined"
            sx={{
              minWidth: isMobile ? "100%" : 150,
              "& .MuiOutlinedInput-root": {
                height: "40px",
              },
              "& .MuiInputBase-input": {
                color: "white",
              },
            }}
          >
            <InputLabel id="search-type-label" sx={{ color: "white" }}>
              Search Type
            </InputLabel>
            <Select
              labelId="search-type-label"
              value={searchType}
              onChange={handleSearchTypeChange}
              label="Search Type"
              sx={{ color: "white" }}
            >
              <MenuItem value="Account">Account</MenuItem>
              <MenuItem value="NFT">NFT</MenuItem>
            </Select>
          </FormControl>
          {searchType === "NFT" && (
            <FormControl
              variant="outlined"
              sx={{
                minWidth: isMobile ? "100%" : 150,
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                },
                "& .MuiInputBase-input": {
                  color: "white",
                  textAlign: "left",
                },
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            >
              <InputLabel id="collection-label" sx={{ color: "white" }}>
                Collection
              </InputLabel>
              <Select
                labelId="collection-label"
                value={collection}
                onChange={handleCollectionChange}
                label="Collection"
                sx={{ color: "white" }}
              >
                <MenuItem value="boredapes">BoredApes</MenuItem>
                <MenuItem value="degods">DeGods</MenuItem>
              </Select>
            </FormControl>
          )}
        </>
      )}
      <Search
        visible={isSearchVisible}
        sx={{ width: isMobile ? "100%" : "auto" }}
      >
        {isSearchVisible && (
          <StyledInputBase
            placeholder={
              searchType === "Account"
                ? "Search Account…"
                : "Search NFT Identifier…"
            }
            inputProps={{ "aria-label": "search" }}
            value={searchType === "Account" ? accountSearch : nftSearch}
            onChange={
              searchType === "Account"
                ? handleAccountInputChange
                : handleNftInputChange
            }
            onKeyPress={handleKeyPress}
          />
        )}
        <SearchIconWrapper onClick={handleSearchIconClick}>
          <SearchIcon />
        </SearchIconWrapper>
      </Search>
    </Box>
  );
}

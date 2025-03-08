import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  AppBar,
  Toolbar,
  CircularProgress,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Home({ walletAddress, connectWallet, loading }) {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch all items when component mounts
  useEffect(() => {
    fetchItems();
  }, []);

  // Fetch items from API
  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/items");
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      } else {
        toast.error("Failed to fetch items");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Error fetching items");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchItems();
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/items/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      } else {
        toast.error("Search failed");
      }
    } catch (error) {
      console.error("Error searching items:", error);
      toast.error("Error searching items");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press for search
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Header left coner
          </Typography>
          {loading ? (
            <CircularProgress size={24} />
          ) : walletAddress ? (
            <>
              <Chip
                label={`${walletAddress.substring(
                  0,
                  6
                )}...${walletAddress.substring(walletAddress.length - 4)}`}
                color="primary"
                sx={{ mr: 2 }}
              />
              <Button
                color="secondary"
                variant="contained"
                onClick={() => router.push("/sell")}
                sx={{ mr: 1 }}
              >
                Sell Item
              </Button>
              <Button
                color="primary"
                variant="contained"
                onClick={() => router.push("/buy")}
                sx={{ mr: 1 }}
              >
                Buy Item
              </Button>
              <Button
                color="primary"
                variant="outlined"
                onClick={() => router.push("/my-items")}
              >
                My Items
              </Button>
            </>
          ) : (
            <Button color="primary" variant="contained" onClick={connectWallet}>
              Connect Wallet
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Header
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Intro
          </Typography>
        </Box>

        <Box sx={{ mb: 4, display: "flex" }}>
          <TextField
            fullWidth
            label="Search items"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            sx={{ ml: 1 }}
          >
            Search
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : items.length > 0 ? (
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.itemId}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {item.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      {item.description}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {item.price} ETH
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.isBuyOrder ? "Buyer" : "Seller"}:{" "}
                      {item.seller.substring(0, 6)}...
                      {item.seller.substring(item.seller.length - 4)}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                      {item.buyer &&
                      item.buyer !==
                        "0x0000000000000000000000000000000000000000" ? (
                        <Chip label="Sold" color="secondary" size="small" />
                      ) : (
                        <Chip
                          label={item.isBuyOrder ? "Buy Order" : "For Sale"}
                          color={item.isBuyOrder ? "info" : "primary"}
                          size="small"
                        />
                      )}
                      <Chip
                        label={item.isBuyOrder ? "Buy Order" : "Sell Order"}
                        color={item.isBuyOrder ? "info" : "success"}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => router.push(`/item/${item.itemId}`)}
                    >
                      View Details
                    </Button>
                    {walletAddress &&
                      !item.isBuyOrder &&
                      (!item.buyer ||
                        item.buyer ===
                          "0x0000000000000000000000000000000000000000") &&
                      item.seller.toLowerCase() !==
                        walletAddress.toLowerCase() && (
                        <Button
                          size="small"
                          color="secondary"
                          onClick={() => router.push(`/item/${item.itemId}`)}
                        >
                          Purchase
                        </Button>
                      )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              No items found
            </Typography>
            {walletAddress && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => router.push("/sell")}
                >
                  Sell an Item
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => router.push("/buy")}
                >
                  Buy an Item
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </>
  );
}

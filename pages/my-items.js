import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function MyItems({ walletAddress, connectWallet, loading }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch user items when component mounts or wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchUserItems();
    } else {
      setItems([]);
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch user items from API
  const fetchUserItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/items/user?address=${walletAddress}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      } else {
        toast.error('Failed to fetch your items');
      }
    } catch (error) {
      console.error('Error fetching user items:', error);
      toast.error('Error fetching your items');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status text and color for an item
  const getStatusInfo = (item) => {
    if (item.buyer) {
      if (item.isDelivered) {
        return { text: 'Delivered', color: 'success' };
      } else {
        return { text: 'Sold', color: 'secondary' };
      }
    } else {
      if (item.isBuyOrder) {
        return { text: 'Buy Order', color: 'info' };
      } else {
        return { text: 'For Sale', color: 'primary' };
      }
    }
  };

  // Determine if user is seller or buyer for an item
  const getUserRole = (item) => {
    if (walletAddress && item.seller && walletAddress.toLowerCase() === item.seller.toLowerCase()) {
      return 'seller';
    } else if (walletAddress && item.buyer && walletAddress.toLowerCase() === item.buyer.toLowerCase()) {
      return 'buyer';
    }
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={() => router.push('/')} sx={{ mb: 2 }}>
        Back to Home
      </Button>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Items
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage your buy and sell orders
        </Typography>
      </Paper>

      {!walletAddress ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" paragraph>
            Please connect your wallet to view your items
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Connect Wallet'}
          </Button>
        </Box>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length > 0 ? (
        <Grid container spacing={3}>
          {items.map((item) => {
            const statusInfo = getStatusInfo(item);
            const userRole = getUserRole(item);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={item.itemId}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography gutterBottom variant="h5" component="h2">
                        {item.name}
                      </Typography>
                      <Chip label={statusInfo.text} color={statusInfo.color} size="small" />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {item.description.length > 100 
                        ? `${item.description.substring(0, 100)}...` 
                        : item.description}
                    </Typography>
                    
                    <Typography variant="h6" color="primary" gutterBottom>
                      {item.price} ETH
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      {userRole === 'seller' ? (
                        <Chip label="You are selling" color="success" size="small" sx={{ mr: 1 }} />
                      ) : userRole === 'buyer' ? (
                        <Chip label="You are buying" color="info" size="small" sx={{ mr: 1 }} />
                      ) : null}
                      
                      {item.isBuyOrder && (
                        <Chip label="Buy Order" color="info" size="small" sx={{ mr: 1 }} />
                      )}
                      {!item.isBuyOrder && (
                        <Chip label="Sell Order" color="success" size="small" sx={{ mr: 1 }} />
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      Listed on: {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary" 
                      onClick={() => router.push(`/item/${item.itemId}`)}
                      fullWidth
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" gutterBottom>
            You don't have any active items
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => router.push('/sell')}
            >
              Sell an Item
            </Button>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => router.push('/buy')}
            >
              Create Buy Order
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
}
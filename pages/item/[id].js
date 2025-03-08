import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, Button, Card, CardContent, CircularProgress, Divider, Grid, Paper, Chip, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { toast } from 'react-toastify';
import { purchaseItem, confirmDelivery, claimPayment, getTradeDetails, editItemPrice } from '../../utils/blockchain';

export default function ItemDetail({ walletAddress, connectWallet, loading }) {
  const router = useRouter();
  const { id } = router.query;
  
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tradeDetails, setTradeDetails] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [newPrice, setNewPrice] = useState('');

  // Fetch item details when component mounts or id changes
  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  // Fetch item details from API
  const fetchItemDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/items/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setItem(data.item);
        
        // Get trade details from blockchain
        const { success, details } = await getTradeDetails(data.item.itemId);
        if (success) {
          setTradeDetails(details);
        }
      } else {
        toast.error('Failed to fetch item details');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      toast.error('Error fetching item details');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle purchase item
  const handlePurchase = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setProcessingAction(true);
      const { success, error } = await purchaseItem(item.itemId, item.price);
      
      if (success) {
        toast.success('Item purchased successfully!');
        fetchItemDetails(); // Refresh data
      } else {
        toast.error(`Failed to purchase item: ${error}`);
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast.error('Error purchasing item');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle confirm delivery
  const handleConfirmDelivery = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setProcessingAction(true);
      const { success, error } = await confirmDelivery(item.itemId);
      
      if (success) {
        toast.success('Delivery confirmed successfully!');
        fetchItemDetails(); // Refresh data
      } else {
        toast.error(`Failed to confirm delivery: ${error}`);
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Error confirming delivery');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle claim payment
  const handleClaimPayment = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setProcessingAction(true);
      const { success, error } = await claimPayment(item.itemId);
      
      if (success) {
        toast.success('Payment claimed successfully!');
        fetchItemDetails(); // Refresh data
      } else {
        toast.error(`Failed to claim payment: ${error}`);
      }
    } catch (error) {
      console.error('Error claiming payment:', error);
      toast.error('Error claiming payment');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle opening the price update dialog
  const handleOpenPriceDialog = () => {
    setNewPrice(item.price); // Set current price as default
    setIsPriceDialogOpen(true);
  };
  
  // Handle closing the price update dialog
  const handleClosePriceDialog = () => {
    setIsPriceDialogOpen(false);
  };
  
  // Handle updating the item price
  const handleUpdatePrice = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    try {
      setProcessingAction(true);
      const { success, error } = await editItemPrice(item.itemId, newPrice);
      
      if (success) {
        // Update price in database
        const response = await fetch(`/api/items/${item.itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            price: newPrice
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Price updated successfully!');
          setIsPriceDialogOpen(false);
          fetchItemDetails(); // Refresh data
        } else {
          toast.error(`Failed to update price in database: ${data.error}`);
        }
      } else {
        toast.error(`Failed to update price on blockchain: ${error}`);
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error updating price');
    } finally {
      setProcessingAction(false);
    }
  };


  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Item not found
        </Typography>
        <Button variant="contained" onClick={() => router.push('/')}>
          Back to Home
        </Button>
      </Container>
    );
  }

  const isSeller = walletAddress && tradeDetails && walletAddress.toLowerCase() === tradeDetails.seller.toLowerCase();
  const isBuyer = walletAddress && tradeDetails && tradeDetails.buyer !== '0x0000000000000000000000000000000000000000' && walletAddress.toLowerCase() === tradeDetails.buyer.toLowerCase();
  const canPurchase = walletAddress && tradeDetails && (tradeDetails.buyer === '0x0000000000000000000000000000000000000000' || !tradeDetails.buyer) && !isSeller;
  const canConfirmDelivery = isBuyer && !tradeDetails.isDelivered;
  const canClaimPayment = isSeller && tradeDetails.isDelivered && !tradeDetails.isCompleted;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={() => router.push('/')} sx={{ mb: 2 }}>
        Back to Home
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h1" gutterBottom>
              {item.name}
            </Typography>
            
            <Typography variant="h5" color="primary" gutterBottom>
              {item.price} ETH
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="text.secondary">
                {item.isBuyOrder ? 'Buyer' : 'Seller'}: {tradeDetails?.seller.substring(0, 6)}...{tradeDetails?.seller.substring(tradeDetails.seller.length - 4)}
              </Typography>
              
              {tradeDetails?.buyer && tradeDetails.buyer !== '0x0000000000000000000000000000000000000000' && (
                <Typography variant="subtitle1" color="text.secondary">
                  {item.isBuyOrder ? 'Seller' : 'Buyer'}: {tradeDetails.buyer.substring(0, 6)}...{tradeDetails.buyer.substring(tradeDetails.buyer.length - 4)}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              {tradeDetails?.buyer && tradeDetails.buyer !== '0x0000000000000000000000000000000000000000' ? (
                <Chip label="Sold" color="secondary" />
              ) : (
                <Chip label={item.isBuyOrder ? "Buy Order" : "For Sale"} color={item.isBuyOrder ? "info" : "primary"} />
              )}
              
              {item.isBuyOrder && (
                <Chip label="Buy Order" color="info" sx={{ ml: 1 }} />
              )}
              {!item.isBuyOrder && (
                <Chip label="Sell Order" color="success" sx={{ ml: 1 }} />
              )}
              
              {tradeDetails?.isDelivered && (
                <Chip label="Delivered" color="success" sx={{ ml: 1 }} />
              )}
              
              {tradeDetails?.isCompleted && (
                <Chip label="Completed" color="info" sx={{ ml: 1 }} />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {item.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {(item.twitterLink || item.telegramLink) && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>
                    
                    {item.twitterLink && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Twitter: <a href={item.twitterLink} target="_blank" rel="noopener noreferrer">{item.twitterLink}</a>
                      </Typography>
                    )}
                    
                    {item.telegramLink && (
                      <Typography variant="body2">
                        Telegram: <a href={item.telegramLink} target="_blank" rel="noopener noreferrer">{item.telegramLink}</a>
                      </Typography>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                  </Box>
                )}
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Listed on: {new Date(item.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        {!walletAddress ? (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Connect Wallet to Interact'}
          </Button>
        ) : (
          <>
            {canPurchase && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handlePurchase}
                disabled={processingAction}
              >
                {processingAction ? <CircularProgress size={24} /> : 'Purchase Item'}
              </Button>
            )}
            
            {canConfirmDelivery && (
              <Button 
                variant="contained" 
                color="success" 
                onClick={handleConfirmDelivery}
                disabled={processingAction}
              >
                {processingAction ? <CircularProgress size={24} /> : 'Confirm Delivery'}
              </Button>
            )}
            
            {canClaimPayment && (
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleClaimPayment}
                disabled={processingAction}
              >
                {processingAction ? <CircularProgress size={24} /> : 'Claim Payment'}
              </Button>
            )}
            
            {/* Add Update Price button for sellers */}
            {isSeller && (!tradeDetails.buyer || tradeDetails.buyer === '0x0000000000000000000000000000000000000000') && (
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleOpenPriceDialog}
                disabled={processingAction}
              >
                Update Price
              </Button>
            )}
          </>
        )}
      </Box>
      
      {/* Price Update Dialog */}
      <Dialog open={isPriceDialogOpen} onClose={handleClosePriceDialog}>
        <DialogTitle>Update Item Price</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Price (ETH)"
            type="number"
            fullWidth
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            inputProps={{ step: '0.000001', min: '0.000001' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePriceDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdatePrice} color="primary" disabled={processingAction}>
            {processingAction ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
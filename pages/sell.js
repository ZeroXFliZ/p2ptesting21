import { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Paper, CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { listItem } from '../utils/blockchain';

export default function SellItem({ walletAddress, connectWallet, loading }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    twitterLink: '',
    telegramLink: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate form
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Item description is required');
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // First, list the item on the blockchain directly from the client-side
      const { success, itemId, error } = await listItem(formData.price, formData.name, formData.description);
      
      if (!success) {
        toast.error(`Failed to list item on blockchain: ${error}`);
        return;
      }
      
      // Then, save the item data to the database via API
      const response = await fetch('/api/items/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          itemId, // Pass the itemId from blockchain
          seller: walletAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Item listed successfully!');
        router.push(`/item/${itemId}`);
      } else {
        toast.error(`Failed to save item details: ${data.error}`);
      }
    } catch (error) {
      console.error('Error listing item:', error);
      toast.error('Error listing item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={() => router.push('/')} sx={{ mb: 2 }}>
        Back to Home
      </Button>
      
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sell an Item
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          List your item on the marketplace for {parseFloat(0.0000004).toFixed(7)} ETH listing fee
        </Typography>

        {!walletAddress ? (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography variant="body1" paragraph>
              Please connect your wallet to sell items
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
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              required
            />
            
            <TextField
              fullWidth
              label="Price (ETH)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              margin="normal"
              inputProps={{ step: '0.000001', min: '0.000001' }}
              required
            />
            
            <TextField
              fullWidth
              label="Twitter Link (optional)"
              name="twitterLink"
              value={formData.twitterLink}
              onChange={handleChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Telegram Link (optional)"
              name="telegramLink"
              value={formData.telegramLink}
              onChange={handleChange}
              margin="normal"
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 3 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Create Sell Order'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
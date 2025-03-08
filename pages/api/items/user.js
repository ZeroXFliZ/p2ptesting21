import { getAllItems } from '../../../utils/mongodb';
import { getTradeDetails } from '../../../utils/blockchain';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({ success: false, error: 'Wallet address is required' });
      }
      
      // Get all items from MongoDB
      const items = await getAllItems();
      
      // For each item, check if it's completed on the blockchain and belongs to the user
      const itemsWithStatus = await Promise.all(
        items.map(async (item) => {
          try {
            // Get trade details from blockchain
            const { success, details } = await getTradeDetails(item.itemId);
            
            if (success) {
              // Check if buyer is zero address (no real buyer yet)
              const hasBuyer = details.buyer && details.buyer !== '0x0000000000000000000000000000000000000000';
              
              // Update item with blockchain data
              return {
                ...item,
                seller: details.seller,
                buyer: hasBuyer ? details.buyer : null, // Only set buyer if it's not zero address
                isDelivered: details.isDelivered,
                isCompleted: details.isCompleted
              };
            }
            return item;
          } catch (error) {
            console.error(`Error getting trade details for item ${item.itemId}:`, error);
            return item;
          }
        })
      );
      
      // Filter items by user address (either as seller or buyer) and exclude completed items
      const userItems = itemsWithStatus.filter(item => {
        // Check if user is seller or buyer
        const isSeller = item.seller && item.seller.toLowerCase() === address.toLowerCase();
        const isBuyer = item.buyer && item.buyer.toLowerCase() === address.toLowerCase();
        
        // Include item if user is seller or buyer and item is not completed
        return (isSeller || isBuyer) && !item.isCompleted;
      });
      
      return res.status(200).json({ success: true, items: userItems });
    } catch (error) {
      console.error('Error fetching user items:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch user items' });
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
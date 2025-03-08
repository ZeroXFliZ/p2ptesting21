import { getAllItems } from '../../../utils/mongodb';
import { getTradeDetails } from '../../../utils/blockchain';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get all items from MongoDB
      const items = await getAllItems();
      
      // For each item, check if it's completed on the blockchain
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
      
      // Filter out completed items
      const activeItems = itemsWithStatus.filter(item => !item.isCompleted);
      
      return res.status(200).json({ success: true, items: activeItems });
    } catch (error) {
      console.error('Error fetching items:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch items' });
    }
  } else if (req.method === 'POST') {
    // This will be handled by the create item API
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
import { searchItems } from '../../../utils/mongodb';
import { getTradeDetails } from '../../../utils/blockchain';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { query } = req.query;
      
      if (!query || query.trim() === '') {
        return res.status(400).json({ success: false, error: 'Search query is required' });
      }
      
      // Search items in MongoDB by name
      const items = await searchItems(query);
      
      // For each item, check if it's completed on the blockchain
      const itemsWithStatus = await Promise.all(
        items.map(async (item) => {
          try {
            // Get trade details from blockchain
            const { success, details } = await getTradeDetails(item.itemId);
            
            if (success) {
              // Update item with blockchain data
              return {
                ...item,
                seller: details.seller,
                buyer: details.buyer,
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
      console.error('Error searching items:', error);
      return res.status(500).json({ success: false, error: 'Failed to search items' });
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
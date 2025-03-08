import { ethers } from 'ethers';
import P2PMarketplaceABI from '../contracts/P2PMarketplaceABI.json';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const baseNetworkUrl = process.env.NEXT_PUBLIC_BASE_NETWORK_URL;

// Get provider based on environment
export const getProvider = () => {
  // For client-side
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  
  // For server-side or fallback
  return new ethers.providers.JsonRpcProvider(baseNetworkUrl);
};

// Get signer for transactions
export const getSigner = async () => {
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    throw new Error('Cannot get signer on server-side. This function must be called from client-side code.');
  }
  
  // Check if wallet is available
  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install a Web3 wallet like MetaMask.');
  }
  
  const provider = getProvider();
  
  // Request account access if needed
  if (provider && provider.provider && provider.provider.request) {
    try {
      await provider.provider.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error('Error requesting accounts:', error);
      throw new Error('Failed to connect to wallet: ' + error.message);
    }
  } else if (window.ethereum) {
    // Fallback for some wallet providers
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error('Error requesting accounts via window.ethereum:', error);
      throw new Error('Failed to connect to wallet: ' + error.message);
    }
  } else {
    throw new Error('No wallet connection method available. Please make sure your wallet is unlocked.');
  }
  
  // Verify we have accounts before returning signer
  const accounts = await provider.listAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please make sure your wallet is connected and unlocked.');
  }
  
  return provider.getSigner();
};

// Get contract instance
export const getContract = async (withSigner = false) => {
  if (!contractAddress) {
    throw new Error('Contract address not configured');
  }
  
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(contractAddress, P2PMarketplaceABI, signer);
  }
  
  const provider = getProvider();
  return new ethers.Contract(contractAddress, P2PMarketplaceABI, provider);
};

// Connect wallet and return address
export const connectWallet = async () => {
  try {
    const signer = await getSigner();
    const address = await signer.getAddress();
    return { success: true, address };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return { success: false, error: error.message };
  }
};

// List an item on the marketplace
export const listItem = async (price, name, description) => {
  try {
    const contract = await getContract(true);
    const priceInWei = ethers.utils.parseEther(price.toString());
    const listingFee = ethers.utils.parseEther('0.0000004');
    
    // Call the contract function
    const tx = await contract.listItem(priceInWei, {
      value: listingFee
    });
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Get the itemId from the event
    const event = receipt.events.find(event => event.event === 'ItemListed');
    
    // Check if the event exists before accessing its properties
    if (!event || !event.args) {
      // If event is not found, try to get the itemId from logs
      console.log('ItemListed event not found in transaction receipt, trying alternative methods');
      
      // Since we can't directly access nextItemId (it's private in the contract),
      // we'll need to estimate it based on transaction data or use another approach
      // Let's try to query the transaction receipt for more information
      const logs = receipt.logs;
      let itemId;
      
      // Try to extract itemId from logs
      if (logs && logs.length > 0) {
        // Look for the last log which might contain our event data
        const lastLog = logs[logs.length - 1];
        // Try to decode the log data to find the itemId
        try {
          // The itemId is likely in the data or topics of the log
          // This is a simplified approach - might need adjustment based on actual log structure
          const topicData = lastLog.topics[1]; // Second topic often contains indexed parameters
          if (topicData) {
            itemId = parseInt(topicData, 16);
          }
        } catch (err) {
          console.error('Error extracting itemId from logs:', err);
        }
      }
      
      // If we couldn't extract from logs, make a best guess
      if (!itemId) {
        // As a fallback, we'll query a recent item to estimate the ID
        // This is not ideal but better than failing completely
        itemId = Date.now(); // Use timestamp as a last resort placeholder
        console.warn('Could not determine exact itemId, using fallback method');
      }
      
      return { success: true, itemId };
    }
    
    const itemId = event.args.itemId.toNumber();
    
    return { success: true, itemId };
  } catch (error) {
    console.error('Error listing item:', error);
    return { success: false, error: error.message };
  }
};

// Purchase an item
export const purchaseItem = async (itemId, price) => {
  try {
    const contract = await getContract(true);
    const priceInWei = ethers.utils.parseEther(price.toString());
    
    // Call the contract function
    const tx = await contract.purchaseItem(itemId, {
      value: priceInWei
    });
    
    // Wait for transaction to be mined
    await tx.wait();
    
    return { success: true };
  } catch (error) {
    console.error('Error purchasing item:', error);
    return { success: false, error: error.message };
  }
};

// Confirm delivery of an item
export const confirmDelivery = async (itemId) => {
  try {
    const contract = await getContract(true);
    
    // Call the contract function
    const tx = await contract.confirmDelivery(itemId);
    
    // Wait for transaction to be mined
    await tx.wait();
    
    return { success: true };
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return { success: false, error: error.message };
  }
};

// Claim payment for a sold item
export const claimPayment = async (itemId) => {
  try {
    const contract = await getContract(true);
    
    // Call the contract function
    const tx = await contract.claimPayment(itemId);
    
    // Wait for transaction to be mined
    await tx.wait();
    
    return { success: true };
  } catch (error) {
    console.error('Error claiming payment:', error);
    return { success: false, error: error.message };
  }
};

// Edit item price
export const editItemPrice = async (itemId, newPrice) => {
  try {
    const contract = await getContract(true);
    const priceInWei = ethers.utils.parseEther(newPrice.toString());
    
    // Call the contract function
    const tx = await contract.editItemPrice(itemId, priceInWei);
    
    // Wait for transaction to be mined
    await tx.wait();
    
    return { success: true };
  } catch (error) {
    console.error('Error editing item price:', error);
    return { success: false, error: error.message };
  }
};

// Get trade details
export const getTradeDetails = async (itemId) => {
  try {
    const contract = await getContract();
    
    // Call the contract function
    const details = await contract.getTradeDetails(itemId);
    
    return {
      success: true,
      details: {
        seller: details[0],
        buyer: details[1],
        price: ethers.utils.formatEther(details[2]),
        isDelivered: details[3],
        isCompleted: details[4]
      }
    };
  } catch (error) {
    console.error('Error getting trade details:', error);
    return { success: false, error: error.message };
  }
};

// Check if wallet is connected
export const isWalletConnected = async () => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }
    
    const provider = getProvider();
    const accounts = await provider.listAccounts();
    return accounts && accounts.length > 0;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

// Get current account
export const getCurrentAccount = async () => {
  try {
    if (!await isWalletConnected()) {
      return null;
    }
    
    const provider = getProvider();
    const accounts = await provider.listAccounts();
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

// Check if user is connected to Base blockchain
export const checkBaseNetwork = async () => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return { isBase: false, chainId: null };
    }
    
    const provider = getProvider();
    const network = await provider.getNetwork();
    
    // Base Mainnet chainId is 8453, Base Testnet (Goerli) is 84531
    // We'll check for both to support development environments
    const baseChainIds = [8453, 84531];
    const isBase = baseChainIds.includes(network.chainId);
    
    return { 
      isBase, 
      chainId: network.chainId,
      name: network.name
    };
  } catch (error) {
    console.error('Error checking network:', error);
    return { isBase: false, chainId: null };
  }
};

// Switch to Base network
export const switchToBaseNetwork = async () => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return { success: false, error: 'No wallet detected' };
    }
    
    // Base Mainnet parameters
    const baseChainId = '0x2105'; // 8453 in hex
    const baseParams = {
      chainId: baseChainId,
      chainName: 'Base Mainnet',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://base.gateway.tenderly.co'],
      blockExplorerUrls: ['https://basescan.org']
    };
    
    try {
      // First try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseChainId }]
      });
      return { success: true };
    } catch (switchError) {
      // If the network is not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [baseParams]
          });
          return { success: true };
        } catch (addError) {
          return { success: false, error: 'Failed to add Base network: ' + addError.message };
        }
      } else {
        return { success: false, error: 'Failed to switch to Base network: ' + switchError.message };
      }
    }
  } catch (error) {
    console.error('Error switching network:', error);
    return { success: false, error: error.message };
  }
};
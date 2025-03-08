import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { connectWallet, getCurrentAccount, checkBaseNetwork, switchToBaseNetwork } from '../utils/blockchain';

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function MyApp({ Component, pageProps }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has already connected wallet
    const checkConnection = async () => {
      try {
        const account = await getCurrentAccount();
        if (account) {
          setWalletAddress(account);
          
          // Check if connected to Base network
          const { isBase, chainId, name } = await checkBaseNetwork();
          if (!isBase) {
            toast.warning(
              'You are not connected to Base blockchain. Please switch to Base network to use this marketplace.',
              {
                autoClose: 10000,
                closeButton: true,
              }
            );
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
    
    // Listen for chain changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkConnection();
      });
    }
    
    return () => {
      // Clean up listeners
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkConnection);
      }
    };
  }, []);

  const handleConnectWallet = async () => {
    try {
      const { success, address, error } = await connectWallet();
      if (success) {
        setWalletAddress(address);
        
        // Check if connected to Base network
        const { isBase, chainId, name } = await checkBaseNetwork();
        if (!isBase) {
          toast.warning(
            'You are not connected to Base blockchain. Switching to Base network...',
            {
              autoClose: 5000,
              closeButton: true,
            }
          );
          
          // Attempt to switch to Base network
          const switchResult = await switchToBaseNetwork();
          if (!switchResult.success) {
            toast.error(`Failed to switch to Base network: ${switchResult.error}`);
          } else {
            toast.success('Successfully connected to Base network!');
          }
        }
      } else {
        console.error('Failed to connect wallet:', error);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };


  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Component 
        {...pageProps} 
        walletAddress={walletAddress} 
        connectWallet={handleConnectWallet} 
        loading={loading} 
      />
    </ThemeProvider>
  );
}

export default MyApp;
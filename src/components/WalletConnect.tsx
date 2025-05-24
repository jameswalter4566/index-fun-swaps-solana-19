import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WalletConnect: React.FC = () => {
  const { publicKey, disconnect, signMessage, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();

  useEffect(() => {
    if (connected && publicKey && signMessage) {
      authenticateWallet();
    }
  }, [connected, publicKey]);

  const authenticateWallet = async () => {
    if (!publicKey || !signMessage) {
      console.error('Public key or signMessage not available');
      return;
    }

    try {
      // Create a message following Phantom's recommended format
      const timestamp = new Date().toISOString();
      const domain = window.location.hostname;
      const message = `Sign this message to authenticate with Index.fun\n\nDomain: ${domain}\nTimestamp: ${timestamp}\nWallet: ${publicKey.toString()}`;
      
      console.log('Requesting signature for message:', message);
      
      // Encode message to Uint8Array for signing
      const messageBytes = new TextEncoder().encode(message);
      
      // Request signature from wallet
      const signature = await signMessage(messageBytes);
      
      // Convert Uint8Array to base64 for transmission
      const signatureBase64 = btoa(String.fromCharCode(...signature));
      
      console.log('Signature obtained, calling auth-wallet function...');

      // Call edge function to authenticate
      const { data, error } = await supabase.functions.invoke('auth-wallet', {
        body: {
          walletAddress: publicKey.toString(),
          signature: signatureBase64,
          message,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Authentication failed');
      }

      if (!data || !data.success) {
        console.error('Authentication failed:', data);
        throw new Error('Authentication failed - invalid response');
      }

      // Store auth token and user info
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('wallet_address', publicKey.toString());
        localStorage.setItem('user_id', data.user?.id || '');
        
        console.log('Authentication successful');
        
        toast({
          title: "Wallet Connected",
          description: "You are now authenticated and can create indexes.",
        });
      } else {
        throw new Error('No authentication token received');
      }
    } catch (error) {
      console.error("Error authenticating wallet:", error);
      
      // Provide specific error messages based on the error type
      let errorMessage = "Failed to authenticate your wallet. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = "Signature request was cancelled. Please try again.";
        } else if (error.message.includes('CORS')) {
          errorMessage = "Connection error. Please check your network and try again.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        }
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clear any partial auth state
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('user_id');
    }
  };

  const connectWallet = () => {
    setVisible(true);
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      
      // Clear all auth-related localStorage items
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('user_id');
      
      toast({
        title: "Wallet Disconnected",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: "Disconnect Error",
        description: "There was an issue disconnecting your wallet.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      {connected && publicKey ? (
        <Button
          onClick={disconnectWallet}
          className="bg-stake-card border border-stake-accent text-stake-text hover:bg-stake-darkbg rounded-md"
        >
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </Button>
      ) : (
        <Button 
          onClick={connectWallet}
          className="bg-stake-highlight hover:opacity-90 text-white rounded-md"
        >
          Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;

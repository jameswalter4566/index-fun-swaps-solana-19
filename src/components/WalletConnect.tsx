
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
    if (connected && publicKey) {
      authenticateWallet();
    }
  }, [connected, publicKey]);

  const authenticateWallet = async () => {
    if (!publicKey || !signMessage) return;

    try {
      const message = `Sign this message to authenticate with Index: ${new Date().toISOString()}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      // Convert Uint8Array to base64
      const signatureBase64 = btoa(String.fromCharCode(...signature));

      // Call edge function to authenticate
      const { data, error } = await supabase.functions.invoke('auth-wallet', {
        body: {
          walletAddress: publicKey.toString(),
          signature: signatureBase64,
          message,
        },
      });

      if (error) throw error;

      // Store auth token
      if (data?.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('wallet_address', publicKey.toString());
        
        toast({
          title: "Wallet Connected",
          description: "You are now authenticated and can create indexes.",
        });
      }
    } catch (error) {
      console.error("Error authenticating wallet:", error);
      toast({
        title: "Authentication Failed",
        description: "Failed to authenticate your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const connectWallet = () => {
    setVisible(true);
  };

  const disconnectWallet = async () => {
    await disconnect();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
    toast({
      title: "Wallet Disconnected",
      description: "You have been logged out.",
    });
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

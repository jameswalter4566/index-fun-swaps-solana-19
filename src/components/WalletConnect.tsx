
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const WalletConnect: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    // In a real application, this would use Solana wallet adapter
    // For now, we'll just mock the connection
    try {
      console.log("Connecting to Phantom wallet...");
      // Mock connection
      setConnected(true);
      setWalletAddress("ABCD...XYZ");
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  const disconnectWallet = () => {
    // In a real application, this would disconnect from the wallet
    setConnected(false);
    setWalletAddress(null);
  };

  return (
    <div>
      {connected ? (
        <Button
          onClick={disconnectWallet}
          className="bg-stake-card border border-stake-accent text-stake-text hover:bg-stake-darkbg rounded-md"
        >
          {walletAddress}
        </Button>
      ) : (
        <Button 
          onClick={connectWallet}
          className="bg-stake-highlight hover:opacity-90 text-white rounded-md"
        >
          connect wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;

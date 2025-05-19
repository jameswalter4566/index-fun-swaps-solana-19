
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWalletStore } from '@/stores/useWalletStore';
import { useToast } from '@/hooks/use-toast';
import { Wallet } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import UserProfile from './UserProfile';

const WalletConnect: React.FC = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const { 
    walletAddress, 
    setConnected, 
    setWalletAddress 
  } = useWalletStore();

  useEffect(() => {
    // Update our store when wallet state changes
    setConnected(connected);
    if (publicKey) {
      const address = publicKey.toString();
      setWalletAddress(address);
      console.log("Connected to wallet:", address);
    } else {
      setWalletAddress(null);
    }
  }, [connected, publicKey, setConnected, setWalletAddress]);

  const connectWallet = () => {
    try {
      setVisible(true);
    } catch (error) {
      console.error("Error opening wallet modal:", error);
      toast({
        title: "connection error",
        description: "could not open the wallet modal",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      setIsProfileOpen(false);
      toast({
        title: "wallet disconnected",
        description: "your wallet has been disconnected",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      {connected && publicKey ? (
        <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <SheetTrigger asChild>
            <Button
              className="bg-stake-card border border-stake-accent text-stake-text hover:bg-stake-darkbg rounded-md"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {walletAddress ? formatWalletAddress(walletAddress) : "connected"}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto p-6">
                <UserProfile onClose={() => setIsProfileOpen(false)} />
              </div>
              <div className="p-4 border-t">
                <Button 
                  onClick={disconnectWallet}
                  variant="outline" 
                  className="w-full border-red-300 text-red-500 hover:bg-red-50"
                >
                  disconnect wallet
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Button 
          onClick={connectWallet}
          className="bg-stake-highlight hover:opacity-90 text-white rounded-md"
        >
          <Wallet className="mr-2 h-4 w-4" />
          connect wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;

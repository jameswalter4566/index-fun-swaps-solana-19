
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import UsernameModal from './UsernameModal';

const WalletConnect: React.FC = () => {
  const { walletAddress, username, isAuthenticated, connectWallet, disconnectWallet, isLoading } = useAuth();
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Show username modal if wallet is connected but no username yet
  useEffect(() => {
    if (isAuthenticated && !username && !isLoading) {
      setShowUsernameModal(true);
    }
  }, [isAuthenticated, username, isLoading]);

  return (
    <>
      {isAuthenticated ? (
        <Button
          onClick={disconnectWallet}
          className="bg-stake-card border border-stake-accent text-stake-text hover:bg-stake-darkbg rounded-md"
        >
          {username ? `@${username}` : walletAddress?.substring(0, 4) + '...' + walletAddress?.substring(walletAddress.length - 4)}
        </Button>
      ) : (
        <Button 
          onClick={connectWallet}
          className="bg-stake-highlight hover:opacity-90 text-white rounded-md"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'connect wallet'}
        </Button>
      )}
      
      <UsernameModal 
        isOpen={showUsernameModal} 
        onClose={() => setShowUsernameModal(false)} 
      />
    </>
  );
};

export default WalletConnect;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import WalletConnect from './WalletConnect';
import HowItWorksModal from './HowItWorksModal';
const Navigation: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <header className="border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-solana-purple">INDEX.FUN</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/create-swap">
              <Button className="btn-solana">Create Index</Button>
            </Link>
            
            <Button variant="ghost" className="hover:bg-gray-100 rounded-full" onClick={() => setIsModalOpen(true)}>
              How it Works
            </Button>
            
            <WalletConnect />
          </div>
        </div>
      </div>
      
      <HowItWorksModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>;
};
export default Navigation;
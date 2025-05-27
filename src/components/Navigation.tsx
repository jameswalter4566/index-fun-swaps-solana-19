
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import WalletConnect from './WalletConnect';
import HowItWorksModal from './HowItWorksModal';

const Navigation: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  return <header className="border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/index" className="flex items-center">
              <span className="text-2xl font-bold text-purple-500">in-dex.fun</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://x.com/index_fun"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-all hover:scale-110"
              aria-label="Follow us on X"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            
            <Link to="/create-swap">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-md">create agent</Button>
            </Link>
            
            <Button variant="ghost" className="hover:bg-gray-800 rounded-md text-gray-400 hover:text-white" onClick={() => setIsModalOpen(true)}>
              how it works
            </Button>
            
            <WalletConnect />
          </div>
        </div>
      </div>
      
      <HowItWorksModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>;
};
export default Navigation;


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
          
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/create-swap')}
              className="bg-purple-600 text-purple-100 hover:bg-white hover:text-purple-600 px-6 py-2 rounded-full font-medium transition-all duration-200"
            >
              Create Agent
            </Button>
            
            <Button
              onClick={() => navigate('/index')}
              className="bg-purple-600 text-purple-100 hover:bg-white hover:text-purple-600 px-6 py-2 rounded-full font-medium transition-all duration-200"
            >
              Explore Agents
            </Button>
            
            <Button
              onClick={() => navigate('/index')}
              className="bg-purple-600 text-purple-100 hover:bg-white hover:text-purple-600 px-6 py-2 rounded-full font-medium transition-all duration-200"
            >
              Trade
            </Button>
            
            <Button
              onClick={() => navigate('/documentation')}
              className="bg-purple-600 text-purple-100 hover:bg-white hover:text-purple-600 px-6 py-2 rounded-full font-medium transition-all duration-200"
            >
              Documentation
            </Button>
            
            <a
              href="https://x.com/index_fun"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 text-purple-100 hover:bg-white hover:text-purple-600 px-6 py-2 rounded-full font-medium transition-all duration-200 inline-block"
            >
              Twitter
            </a>
            
            <Button variant="ghost" className="hover:bg-gray-800 rounded-md text-gray-400 hover:text-white" onClick={() => setIsModalOpen(true)}>
              How it works
            </Button>
            
            <WalletConnect />
          </div>
        </div>
      </div>
      
      <HowItWorksModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>;
};
export default Navigation;

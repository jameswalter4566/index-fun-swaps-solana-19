
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import WalletConnect from './WalletConnect';
import HowItWorksModal from './HowItWorksModal';
import { Menu, X } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <>
      <header className="border-b border-gray-800 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <Link to="/guardian" className="flex items-center gap-2 sm:gap-3">
                <img src="/GUARDIANLOGO.jpg" alt="Guardian" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                <span className="text-xl sm:text-2xl font-bold text-purple-500">Guardian</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <a
                href="https://x.com/guardiandotcash"
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
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-md">create guardian</Button>
              </Link>
              
              <Button variant="ghost" className="hover:bg-gray-800 rounded-md text-gray-400 hover:text-white" onClick={() => setIsModalOpen(true)}>
                how it works
              </Button>
              
              <Link to="/documentation">
                <Button variant="ghost" className="hover:bg-gray-800 rounded-md text-gray-400 hover:text-white">
                  documentation
                </Button>
              </Link>
              
              <WalletConnect />
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-black border-b border-gray-800 z-50">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link to="/create-swap" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md">
                  create guardian
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full hover:bg-gray-800 rounded-md text-gray-400 hover:text-white" 
                onClick={() => {
                  setIsModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                how it works
              </Button>
              
              <Link to="/documentation" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full hover:bg-gray-800 rounded-md text-gray-400 hover:text-white">
                  documentation
                </Button>
              </Link>
              
              <div className="pt-2">
                <WalletConnect />
              </div>
              
              <a
                href="https://x.com/guardiandotcash"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-all"
                aria-label="Follow us on X"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Follow on X
              </a>
            </div>
          </div>
        )}
      </header>
      
      <HowItWorksModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
export default Navigation;

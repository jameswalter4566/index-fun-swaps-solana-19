
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import WalletConnect from './WalletConnect';
import HowItWorksModal from './HowItWorksModal';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import CreateSwapForm from './CreateSwapForm';
import { X } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return <header className="border-b border-stake-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-stake-accent">INDEX.FUN</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Drawer>
              <DrawerTrigger asChild>
                <Button className="bg-stake-accent hover:bg-stake-highlight text-white rounded-md">create index</Button>
              </DrawerTrigger>
              <DrawerContent className="h-[90vh] overflow-y-auto">
                <div className="container mx-auto max-w-md p-4 relative">
                  <DrawerHeader className="text-center">
                    <DrawerTitle className="text-2xl font-bold">create a new index</DrawerTitle>
                    <DrawerDescription>
                      create a bundle of tokens that people can swap into with a single transaction
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerClose className="absolute right-4 top-4 rounded-full p-2 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DrawerClose>
                  <CreateSwapForm />
                </div>
              </DrawerContent>
            </Drawer>
            
            <Button variant="ghost" className="hover:bg-stake-card rounded-md text-stake-muted hover:text-stake-text" onClick={() => setIsModalOpen(true)}>
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

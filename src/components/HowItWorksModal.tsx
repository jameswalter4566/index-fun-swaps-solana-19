import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose
}) => {
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">How it Works</DialogTitle>
        </DialogHeader>
        <DialogDescription className="space-y-4 text-base">
          <div className="flex flex-col gap-6 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-solana-purple">What are AI Trading Guardians?</h3>
              <p>AI Trading Guardians monitor the Twitter accounts you select for trading signals and automatically execute trades based on your parameters.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-solana-purple">How do they work?</h3>
              <p>Our guardians scan up to 4 Twitter accounts for keywords indicating potential trades. They also monitor the market for coins matching your specified parameters.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-solana-purple">Creating a Guardian</h3>
              <p>Select 4 Twitter accounts to monitor and set your coin parameters. When a match is found, the guardian automatically purchases the coin for you.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-solana-purple">Stay Notified</h3>
              <p>Add your phone number to receive SMS notifications when your guardian makes trades or finds opportunities matching your criteria.</p>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>;
};
export default HowItWorksModal;
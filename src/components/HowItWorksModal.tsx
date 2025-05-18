
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">How INDEX.FUN Works</DialogTitle>
        </DialogHeader>
        <DialogDescription className="space-y-4 text-base">
          <div className="flex flex-col gap-6 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-solana-purple">What is an INDEX?</h3>
              <p>An INDEX is a bundle of tokens that you can swap into with a single transaction.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-solana-purple">How do I use an INDEX?</h3>
              <p>Simply put in 1-4 SOL and receive equal value of all tokens in the INDEX in one transaction.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-solana-purple">Creating an INDEX</h3>
              <p>Anyone can create an INDEX! Just select the tokens you want to include (up to 4) and give it a name.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-solana-purple">Discovering INDEXES</h3>
              <p>Browse popular INDEXES, see which ones are gaining value, and upvote your favorites to help others discover them.</p>
            </div>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;

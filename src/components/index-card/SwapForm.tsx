
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SwapFormProps {
  indexName: string;
  solanaAmount: string;
  onSolanaAmountChange: (amount: string) => void;
}

const SwapForm: React.FC<SwapFormProps> = ({ 
  indexName, 
  solanaAmount, 
  onSolanaAmountChange 
}) => {
  return (
    <div className="bg-stake-card p-4 rounded-lg">
      <h3 className="text-lg font-bold text-stake-text mb-3">swap</h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">sol</span>
        </div>
        <Input
          type="number"
          placeholder="amount"
          className="bg-stake-darkbg border-stake-card text-stake-text"
          value={solanaAmount}
          onChange={(e) => onSolanaAmountChange(e.target.value)}
        />
      </div>
      <Button 
        className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-2"
      >
        swap {solanaAmount} sol for {indexName}
      </Button>
    </div>
  );
};

export default SwapForm;

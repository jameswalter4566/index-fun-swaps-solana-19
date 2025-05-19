
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import PercentageChanges from './PercentageChanges';
import IndexChart from './IndexChart';
import TokenList from './TokenList';
import SwapForm from './SwapForm';
import { Token } from '@/stores/useIndexStore';
import { TokenData } from '@/lib/tokenService';

interface IndexSwapSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  tokens: Token[];
  formattedWeightedMarketCap: string;
  formattedVolume: string;
  percentChange1h: number;
  percentChange6h: number;
  gainPercentage: number;
  chartData: any[];
  isLoadingDetails: boolean;
  tokenDetails: Record<string, TokenData>;
  onCopyAddress: (address: string) => void;
  solanaAmount: string;
  onSolanaAmountChange: (amount: string) => void;
}

const IndexSwapSheet: React.FC<IndexSwapSheetProps> = ({
  open,
  onOpenChange,
  name,
  tokens,
  formattedWeightedMarketCap,
  formattedVolume,
  percentChange1h,
  percentChange6h,
  gainPercentage,
  chartData,
  isLoadingDetails,
  tokenDetails,
  onCopyAddress,
  solanaAmount,
  onSolanaAmountChange
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90%] sm:max-w-[540px] bg-stake-background border-stake-card">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-stake-text">{name} index</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium text-stake-muted">total weighted market cap</h3>
              <p className="text-xl font-bold text-stake-text">{formattedWeightedMarketCap}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-stake-muted">total volume</h3>
              <p className="text-xl font-bold text-stake-text">{formattedVolume}</p>
            </div>
          </div>
          
          {/* Percentage changes grid */}
          <PercentageChanges 
            percentChange1h={percentChange1h}
            percentChange6h={percentChange6h}
            gainPercentage={gainPercentage}
          />
          
          <IndexChart data={chartData} />
          
          <div className="mb-6">
            <h3 className="text-lg font-bold text-stake-text mb-3">tokens</h3>
            
            <TokenList 
              tokens={tokens}
              tokenDetails={tokenDetails}
              isLoadingDetails={isLoadingDetails}
              onCopyAddress={onCopyAddress}
            />
          </div>
          
          <SwapForm 
            indexName={name}
            solanaAmount={solanaAmount}
            onSolanaAmountChange={onSolanaAmountChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IndexSwapSheet;

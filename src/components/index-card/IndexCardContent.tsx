
import React from 'react';
import { Heart } from 'lucide-react';
import { Token } from '@/stores/useIndexStore';
import { useMultiTokenSubscription } from '@/hooks/useTokenSubscription';

interface IndexCardContentProps {
  name: string;
  tokens: Token[];
  formattedWeightedMarketCap: string;
  formattedVolume: string;
  gainPercentage: number;
  gainColor: string;
  upvotes: number;
  isUpvoted: boolean;
  onUpvote: () => void;
  onSwap: () => void;
}

const IndexCardContent: React.FC<IndexCardContentProps> = ({
  name,
  tokens,
  formattedWeightedMarketCap,
  formattedVolume,
  gainPercentage,
  gainColor,
  upvotes,
  isUpvoted,
  onUpvote,
  onSwap
}) => {
  // Subscribe to all tokens in this index for real-time updates
  const tokenAddresses = tokens.map(token => token.address);
  const liveTokenData = useMultiTokenSubscription(tokenAddresses);

  // Calculate the live 24h percentage change based on all tokens
  const liveGainPercentage = tokenAddresses.length > 0 
    ? tokenAddresses.reduce((sum, address) => {
        const tokenData = liveTokenData[address];
        if (tokenData?.change24h !== undefined) {
          return sum + (tokenData.change24h || 0);
        }
        return sum;
      }, 0) / tokenAddresses.length
    : gainPercentage;

  // Use live data if available, otherwise fall back to the provided value
  const displayedGainPercentage = isNaN(liveGainPercentage) ? 
    gainPercentage : 
    liveGainPercentage;
  
  // Calculate the color based on the displayed percentage
  const displayedGainColor = displayedGainPercentage >= 0 
    ? 'text-green-500' 
    : 'text-red-500';

  return (
    <div className="space-y-4">
      {/* Display weighted market cap */}
      <div className="bg-stake-darkbg/50 p-2 rounded-md">
        <span className="text-xs text-stake-muted">total weighted market cap</span>
        <p className="text-sm font-semibold text-stake-text">{formattedWeightedMarketCap}</p>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-stake-muted mb-2">tokens</h4>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => {
            // Get live token data if available
            const liveToken = liveTokenData[token.address];
            
            return (
              <span 
                key={token.address} 
                className="inline-flex items-center gap-1 bg-stake-darkbg rounded-full px-3 py-1 text-xs text-stake-text"
              >
                {(liveToken?.symbol || token.symbol || token.name)}
                
                {liveToken?.change24h !== undefined && (
                  <span className={liveToken.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {liveToken.change24h >= 0 ? '+' : ''}{liveToken.change24h.toFixed(1)}%
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      
      {/* Volume information */}
      <div className="bg-stake-darkbg/50 p-2 rounded-md">
        <span className="text-xs text-stake-muted">volume</span>
        <p className="text-sm font-semibold text-stake-text">{formattedVolume}</p>
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-stake-background">
        <button 
          onClick={onUpvote} 
          className={`flex items-center gap-1 text-sm ${isUpvoted ? 'text-stake-accent' : 'text-stake-muted'} hover:text-stake-accent transition-colors`}
        >
          <Heart size={16} className={isUpvoted ? 'fill-stake-accent' : ''} />
          <span>{upvotes}</span>
        </button>
        
        <button 
          className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-4 rounded-full transition-colors"
          onClick={onSwap}
        >
          swap
        </button>
      </div>
    </div>
  );
};

export default IndexCardContent;

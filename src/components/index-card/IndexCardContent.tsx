
import React, { useMemo, useState, useEffect } from 'react';
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
  const [prevMarketCap, setPrevMarketCap] = useState(formattedWeightedMarketCap);
  const [isMarketCapChanged, setIsMarketCapChanged] = useState(false);
  const [marketCapDirection, setMarketCapDirection] = useState<'up' | 'down' | null>(null);
  
  // Subscribe to all tokens in this index for real-time updates
  const tokenAddresses = tokens.map(token => token.address);
  const liveTokenData = useMultiTokenSubscription(tokenAddresses);

  // Detect when market cap changes to trigger animation
  useEffect(() => {
    if (prevMarketCap !== formattedWeightedMarketCap && prevMarketCap !== 'Loading...') {
      setIsMarketCapChanged(true);
      
      // Determine if market cap went up or down (basic string comparison)
      // This works because the format is consistent ($X.XM, $X.XK, etc.)
      if (prevMarketCap < formattedWeightedMarketCap) {
        setMarketCapDirection('up');
      } else if (prevMarketCap > formattedWeightedMarketCap) {
        setMarketCapDirection('down');
      }
      
      // Reset the animation after 1 second
      const timer = setTimeout(() => {
        setIsMarketCapChanged(false);
        setPrevMarketCap(formattedWeightedMarketCap);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [formattedWeightedMarketCap, prevMarketCap]);
  
  // Calculate live metrics based on WebSocket data
  const liveMetrics = useMemo(() => {
    if (Object.keys(liveTokenData).length === 0) return null;

    // Calculate weighted averages from live data
    let totalChange24h = 0;
    let totalChange1h = 0;
    let totalChange6h = 0;
    let validTokenCount24h = 0;
    let validTokenCount1h = 0;
    let validTokenCount6h = 0;
    let totalPrice = 0;
    let validPriceCount = 0;
    
    for (const address of tokenAddresses) {
      const token = liveTokenData[address];
      if (token) {
        if (token.change24h !== undefined) {
          totalChange24h += token.change24h;
          validTokenCount24h++;
        }
        
        if (token.change1h !== undefined) {
          totalChange1h += token.change1h;
          validTokenCount1h++;
        }
        
        if (token.change6h !== undefined) {
          totalChange6h += token.change6h;
          validTokenCount6h++;
        }
        
        if (token.price !== undefined) {
          totalPrice += token.price;
          validPriceCount++;
        }
      }
    }
    
    // Calculate averages only if we have valid data
    return {
      change24h: validTokenCount24h > 0 ? totalChange24h / validTokenCount24h : null,
      change1h: validTokenCount1h > 0 ? totalChange1h / validTokenCount1h : null,
      change6h: validTokenCount6h > 0 ? totalChange6h / validTokenCount6h : null,
      averagePrice: validPriceCount > 0 ? totalPrice / validPriceCount : null,
      hasLiveData: validTokenCount24h > 0 || validTokenCount1h > 0 || validTokenCount6h > 0
    };
  }, [liveTokenData, tokenAddresses]);

  // Use live data if available, otherwise fall back to the provided value
  const displayedGainPercentage = liveMetrics?.change24h !== null && liveMetrics?.change24h !== undefined 
    ? liveMetrics.change24h 
    : gainPercentage;
  
  // Calculate the color based on the displayed percentage
  const displayedGainColor = displayedGainPercentage >= 0 
    ? 'text-green-500' 
    : 'text-red-500';

  // Determine if we have any live data
  const hasLiveData = liveMetrics?.hasLiveData === true;

  // Market cap animation and directional indicator classes
  const marketCapClass = isMarketCapChanged
    ? marketCapDirection === 'up'
      ? 'text-green-500 animate-pulse-subtle'
      : marketCapDirection === 'down'
        ? 'text-red-500 animate-pulse-subtle'
        : 'animate-pulse-subtle'
    : hasLiveData ? 'animate-pulse-subtle' : '';
    
  const marketCapIndicator = marketCapDirection === 'up' ? '↑' : marketCapDirection === 'down' ? '↓' : '';

  return (
    <div className="space-y-4">
      {/* Display weighted market cap */}
      <div className="bg-stake-darkbg/50 p-2 rounded-md">
        <span className="text-xs text-stake-muted">total weighted market cap</span>
        <p className={`text-sm font-semibold text-stake-text flex items-center ${marketCapClass}`}>
          {formattedWeightedMarketCap}
          {marketCapIndicator && (
            <span className={`ml-1 ${marketCapDirection === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {marketCapIndicator}
            </span>
          )}
        </p>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-stake-muted mb-2">tokens</h4>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => {
            // Get live token data if available
            const liveToken = liveTokenData[token.address];
            const hasLiveChange = liveToken?.change24h !== undefined;
            
            return (
              <span 
                key={token.address} 
                className="inline-flex items-center gap-1 bg-stake-darkbg rounded-full px-3 py-1 text-xs text-stake-text"
              >
                {(liveToken?.symbol || token.symbol || token.name)}
                
                {hasLiveChange && (
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

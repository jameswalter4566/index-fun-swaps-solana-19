
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TokenData } from '@/lib/tokenService';

interface TokenItemProps {
  token: {
    address: string;
    name: string;
    symbol?: string;
    imageUrl?: string;
  };
  tokenDetail?: TokenData;
  onCopyAddress: (address: string) => void;
}

const TokenItem: React.FC<TokenItemProps> = ({ token, tokenDetail, onCopyAddress }) => {
  const marketCap = tokenDetail?.marketCap;
  const change24h = tokenDetail?.change24h || 0;
  const changeColor = change24h >= 0 ? 'text-green-500' : 'text-red-500';

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    
    if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    } else if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(1)}K`;
    } else {
      return `$${marketCap}`;
    }
  };

  return (
    <div className="flex justify-between items-center bg-stake-card p-3 rounded-lg">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={tokenDetail?.imageUrl || token.imageUrl} 
            alt={tokenDetail?.name || token.name} 
          />
          <AvatarFallback className="bg-stake-darkbg text-xs">
            {token.symbol ? token.symbol.substring(0, 2) : 
             (tokenDetail?.symbol ? tokenDetail.symbol.substring(0, 2) : 
             token.name.substring(0, 2).toUpperCase())}
          </AvatarFallback>
        </Avatar>
        <div>
          <span className="font-medium text-stake-text">
            {tokenDetail?.name || token.name}
            {tokenDetail?.symbol && <span className="ml-1 text-stake-muted text-xs">({tokenDetail.symbol})</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stake-muted">
              {marketCap ? formatMarketCap(marketCap) : 'n/a'}
            </span>
            {change24h !== undefined && (
              <span className={`text-xs ${changeColor}`}>
                {change24h >= 0 ? '+' : ''}{change24h}%
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <span className="text-xs text-stake-muted mr-2 truncate max-w-[120px]">
          {`${token.address.substring(0, 6)}...${token.address.substring(token.address.length - 4)}`}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onCopyAddress(token.address)}
            >
              copy
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 text-xs">
            address copied!
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default TokenItem;

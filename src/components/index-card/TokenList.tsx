
import React from 'react';
import TokenItem from './TokenItem';
import { TokenData } from '@/lib/token';
import { Token } from '@/stores/useIndexStore';

interface TokenListProps {
  tokens: Token[];
  tokenDetails: Record<string, TokenData>;
  isLoadingDetails: boolean;
  onCopyAddress: (address: string) => void;
}

const TokenList: React.FC<TokenListProps> = ({ 
  tokens, 
  tokenDetails, 
  isLoadingDetails, 
  onCopyAddress 
}) => {
  if (isLoadingDetails) {
    return (
      <div className="text-center py-4 text-stake-muted">
        loading token details...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokens.map((token) => (
        <TokenItem 
          key={token.address}
          token={token} 
          tokenDetail={tokenDetails[token.address]} 
          onCopyAddress={onCopyAddress}
        />
      ))}
    </div>
  );
};

export default TokenList;

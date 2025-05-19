
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';
import { useIndexStore, IndexData } from '@/stores/useIndexStore';
import { useIndexCardData } from './useIndexCardData';
import IndexCardContent from './IndexCardContent';
import IndexSwapSheet from './IndexSwapSheet';
import { useMultiTokenSubscription } from '@/hooks/useTokenSubscription';

interface IndexCardProps {
  index: IndexData;
}

const IndexCard: React.FC<IndexCardProps> = ({ index }) => {
  const { 
    id, 
    name, 
    tokens, 
    upvotes, 
    gainPercentage = 0, 
    marketCap = 0,
    totalVolume = 0,
    percentChange1h = 0,
    percentChange6h = 0,
    upvotedBy
  } = index;
  
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const { upvoteIndex, downvoteIndex } = useIndexStore();
  
  // Check if the current user has upvoted this index
  const isUpvoted = publicKey && upvotedBy.includes(publicKey.toString());
  
  // Use the custom hook to manage the card's data
  const {
    showSwapSheet,
    setShowSwapSheet,
    solanaAmount,
    setSolanaAmount,
    chartData,
    tokenDetails,
    isLoadingDetails,
    weightedMarketCap,
    isLoadingMarketCap,
    handleCopyAddress,
    formatMarketCap,
    formatVolume,
    getPercentageColor
  } = useIndexCardData(tokens);

  // Subscribe to all tokens in this index for real-time updates
  const tokenAddresses = tokens.map(token => token.address);
  const liveTokenData = useMultiTokenSubscription(tokenAddresses);

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
      }
    }
    
    // Calculate averages only if we have valid data
    return {
      change24h: validTokenCount24h > 0 ? totalChange24h / validTokenCount24h : null,
      change1h: validTokenCount1h > 0 ? totalChange1h / validTokenCount1h : null,
      change6h: validTokenCount6h > 0 ? totalChange6h / validTokenCount6h : null,
      hasLiveData: validTokenCount24h > 0 || validTokenCount1h > 0 || validTokenCount6h > 0
    };
  }, [liveTokenData, tokenAddresses]);
  
  const handleUpvote = () => {
    if (!connected || !publicKey) {
      toast({
        title: "wallet not connected",
        description: "please connect your wallet to upvote",
        variant: "destructive",
      });
      setVisible(true);
      return;
    }
    
    const walletAddress = publicKey.toString();
    
    if (isUpvoted) {
      downvoteIndex(id, walletAddress);
    } else {
      upvoteIndex(id, walletAddress);
    }
  };
  
  const handleSwap = () => {
    if (!connected) {
      toast({
        title: "wallet not connected",
        description: "please connect your wallet to swap",
        variant: "destructive",
      });
      setVisible(true);
      return;
    }
    
    setShowSwapSheet(true);
  };
  
  // Use live data if available, otherwise fall back to static values
  const displayedGainPercentage = liveMetrics?.change24h !== null && liveMetrics?.change24h !== undefined 
    ? liveMetrics.change24h 
    : gainPercentage;
    
  const displayedChange1h = liveMetrics?.change1h !== null && liveMetrics?.change1h !== undefined
    ? liveMetrics.change1h
    : percentChange1h;
    
  const displayedChange6h = liveMetrics?.change6h !== null && liveMetrics?.change6h !== undefined
    ? liveMetrics.change6h
    : percentChange6h;
  
  const gainColor = getPercentageColor(displayedGainPercentage);
  const formattedWeightedMarketCap = isLoadingMarketCap
    ? 'Calculating...'
    : formatMarketCap(weightedMarketCap);
  const formattedVolume = formatVolume(totalVolume);
  
  // Determine if we have any live data
  const hasLiveData = liveMetrics?.hasLiveData === true;
  
  return (
    <>
      <Card className="overflow-hidden card-hover border border-stake-card bg-stake-card">
        <CardHeader className="p-4 bg-stake-darkbg border-b border-stake-background">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-stake-text">{name}</CardTitle>
            <span className={`font-bold ${gainColor} ${hasLiveData ? 'animate-pulse-subtle' : ''}`}>
              {displayedGainPercentage >= 0 ? '+' : ''}{displayedGainPercentage.toFixed(2)}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <IndexCardContent
            name={name}
            tokens={tokens}
            formattedWeightedMarketCap={formattedWeightedMarketCap}
            formattedVolume={formattedVolume}
            gainPercentage={displayedGainPercentage}
            gainColor={gainColor}
            upvotes={upvotes}
            isUpvoted={!!isUpvoted}
            onUpvote={handleUpvote}
            onSwap={handleSwap}
          />
        </CardContent>
      </Card>
      
      <IndexSwapSheet
        open={showSwapSheet}
        onOpenChange={setShowSwapSheet}
        name={name}
        tokens={tokens}
        formattedWeightedMarketCap={formattedWeightedMarketCap}
        formattedVolume={formattedVolume}
        percentChange1h={displayedChange1h}
        percentChange6h={displayedChange6h}
        gainPercentage={displayedGainPercentage}
        chartData={chartData}
        isLoadingDetails={isLoadingDetails}
        tokenDetails={tokenDetails}
        onCopyAddress={handleCopyAddress}
        solanaAmount={solanaAmount}
        onSolanaAmountChange={setSolanaAmount}
        hasLiveData={hasLiveData}
      />
    </>
  );
};

export default IndexCard;

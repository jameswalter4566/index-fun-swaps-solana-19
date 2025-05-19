
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';
import { useIndexStore, IndexData } from '@/stores/useIndexStore';
import { useIndexCardData } from './useIndexCardData';
import IndexCardContent from './IndexCardContent';
import IndexSwapSheet from './IndexSwapSheet';

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
  const { upvoteIndex, downvoteIndex, updateIndexGains } = useIndexStore();
  
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
    getPercentageColor,
    gainPercentages,
    isSubscribed
  } = useIndexCardData(tokens);
  
  // Update the index store with live data when it changes
  useEffect(() => {
    if (isSubscribed && weightedMarketCap !== null) {
      const change24h = gainPercentages.change24h !== undefined ? 
        gainPercentages.change24h : gainPercentage;
      
      updateIndexGains(
        id,
        change24h,
        weightedMarketCap,
        gainPercentages.change1h || percentChange1h,
        gainPercentages.change6h || percentChange6h
      );
    }
  }, [
    id, 
    weightedMarketCap, 
    gainPercentages, 
    updateIndexGains, 
    isSubscribed, 
    gainPercentage, 
    percentChange1h, 
    percentChange6h
  ]);
  
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
  
  // Use real-time data if available, otherwise fall back to stored data
  const displayGainPercentage = gainPercentages.change24h !== undefined && isSubscribed ? 
    gainPercentages.change24h : gainPercentage;
  
  const displayMarketCap = weightedMarketCap !== null && isSubscribed ?
    weightedMarketCap : marketCap;
    
  const displayPercentChange1h = gainPercentages.change1h !== undefined && isSubscribed ?
    gainPercentages.change1h : percentChange1h;
    
  const displayPercentChange6h = gainPercentages.change6h !== undefined && isSubscribed ?
    gainPercentages.change6h : percentChange6h;
  
  const gainColor = getPercentageColor(displayGainPercentage);
  const formattedWeightedMarketCap = isLoadingMarketCap
    ? 'Calculating...'
    : formatMarketCap(displayMarketCap);
  const formattedVolume = formatVolume(totalVolume);
  
  return (
    <>
      <Card className="overflow-hidden card-hover border border-stake-card bg-stake-card">
        <CardHeader className="p-4 bg-stake-darkbg border-b border-stake-background">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-stake-text">{name}</CardTitle>
            <span className={`font-bold ${gainColor}`}>
              {displayGainPercentage >= 0 ? '+' : ''}{displayGainPercentage}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <IndexCardContent
            name={name}
            tokens={tokens}
            formattedWeightedMarketCap={formattedWeightedMarketCap}
            formattedVolume={formattedVolume}
            gainPercentage={displayGainPercentage}
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
        percentChange1h={displayPercentChange1h}
        percentChange6h={displayPercentChange6h}
        gainPercentage={displayGainPercentage}
        chartData={chartData}
        isLoadingDetails={isLoadingDetails}
        tokenDetails={tokenDetails}
        onCopyAddress={handleCopyAddress}
        solanaAmount={solanaAmount}
        onSolanaAmountChange={setSolanaAmount}
      />
    </>
  );
};

export default IndexCard;

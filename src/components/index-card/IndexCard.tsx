
import React from 'react';
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
  
  const gainColor = getPercentageColor(gainPercentage);
  const formattedWeightedMarketCap = formatMarketCap(weightedMarketCap);
  const formattedVolume = formatVolume(totalVolume);
  
  return (
    <>
      <Card className="overflow-hidden card-hover border border-stake-card bg-stake-card">
        <CardHeader className="p-4 bg-stake-darkbg border-b border-stake-background">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-stake-text">{name}</CardTitle>
            <span className={`font-bold ${gainColor}`}>
              {gainPercentage >= 0 ? '+' : ''}{gainPercentage}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <IndexCardContent
            name={name}
            tokens={tokens}
            formattedWeightedMarketCap={formattedWeightedMarketCap}
            formattedVolume={formattedVolume}
            gainPercentage={gainPercentage}
            gainColor={gainColor}
            upvotes={upvotes}
            isUpvoted={!!isUpvoted}
            onUpvote={handleUpvote}
            onSwap={handleSwap}
            isLoadingMarketCap={isLoadingMarketCap}
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
        percentChange1h={percentChange1h}
        percentChange6h={percentChange6h}
        gainPercentage={gainPercentage}
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

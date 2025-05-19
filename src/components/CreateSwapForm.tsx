
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useIndexStore, Token } from '@/stores/useIndexStore';
import { getTokenData, isValidSolanaAddress } from '@/lib/token';
import { Loader } from 'lucide-react';

interface TokenInput {
  address: string;
  data: Token | null;
  isLoading: boolean;
  isValid: boolean;
}

const CreateSwapForm: React.FC = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { addIndex } = useIndexStore();
  
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Token inputs with validation and loading states
  const [tokens, setTokens] = useState<TokenInput[]>([
    { address: '', data: null, isLoading: false, isValid: true },
    { address: '', data: null, isLoading: false, isValid: true },
    { address: '', data: null, isLoading: false, isValid: true },
    { address: '', data: null, isLoading: false, isValid: true },
  ]);

  const updateTokenAddress = async (index: number, address: string) => {
    // Update the address immediately for responsive UI
    setTokens(prev => {
      const newTokens = [...prev];
      newTokens[index] = {
        ...newTokens[index],
        address,
        isValid: true, // Reset validation
        isLoading: address.length >= 32, // Only show loading for addresses that could be valid
      };
      return newTokens;
    });
    
    // Skip validation for empty or short addresses
    if (address.length < 32) {
      setTokens(prev => {
        const newTokens = [...prev];
        newTokens[index] = {
          ...newTokens[index],
          data: null,
          isLoading: false,
          isValid: true,
        };
        return newTokens;
      });
      return;
    }
    
    // Validate and fetch token data
    const isValid = isValidSolanaAddress(address);
    
    if (isValid) {
      try {
        const tokenData = await fetchTokenData(address);
        
        setTokens(prev => {
          const newTokens = [...prev];
          newTokens[index] = {
            ...newTokens[index],
            data: tokenData,
            isLoading: false,
            isValid: Boolean(tokenData),
          };
          return newTokens;
        });
      } catch (error) {
        console.error("Error fetching token data:", error);
        setTokens(prev => {
          const newTokens = [...prev];
          newTokens[index] = {
            ...newTokens[index],
            data: null,
            isLoading: false,
            isValid: false,
          };
          return newTokens;
        });
      }
    } else {
      setTokens(prev => {
        const newTokens = [...prev];
        newTokens[index] = {
          ...newTokens[index],
          data: null,
          isLoading: false,
          isValid: false,
        };
        return newTokens;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if wallet is connected
    if (!connected || !publicKey) {
      toast({
        title: "wallet not connected",
        description: "please connect your wallet to create an index",
        variant: "destructive",
      });
      setVisible(true);
      return;
    }
    
    // Validate form
    if (!name) {
      toast({
        title: "form validation error",
        description: "index name is required.",
        variant: "destructive",
      });
      return;
    }
    
    // We need at least 2 valid tokens
    const validTokens = tokens.filter(t => t.data && t.address.trim() !== '');
    if (validTokens.length < 2) {
      toast({
        title: "form validation error",
        description: "at least 2 valid tokens are required.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the new index with valid tokens
      const tokensList = validTokens.map(t => ({
        address: t.address,
        name: t.data?.name || 'Unknown Token',
        symbol: t.data?.symbol || '???',
        imageUrl: t.data?.imageUrl,
        decimals: t.data?.decimals,
      }));
      
      // Add to store
      addIndex({
        name,
        tokens: tokensList,
        creatorAddress: publicKey.toString(),
      });
      
      toast({
        title: "index created!",
        description: `your ${name} index has been created successfully.`,
      });
      
      // Reset form
      setName('');
      setTokens([
        { address: '', data: null, isLoading: false, isValid: true },
        { address: '', data: null, isLoading: false, isValid: true },
        { address: '', data: null, isLoading: false, isValid: true },
        { address: '', data: null, isLoading: false, isValid: true },
      ]);
      
      // The drawer will close after successful create
      const drawerCloseButton = document.querySelector('[data-drawer-close="true"]') as HTMLButtonElement;
      if (drawerCloseButton) {
        setTimeout(() => drawerCloseButton.click(), 1500);
      }
    } catch (error) {
      console.error("Error creating INDEX:", error);
      toast({
        title: "error creating index",
        description: "there was an error creating your index. please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTokenInput = (index: number, tokenInput: TokenInput) => {
    const { address, data, isLoading, isValid } = tokenInput;
    const isRequired = index < 2;
    
    return (
      <div className="space-y-2" key={`token-input-${index}`}>
        <Label htmlFor={`token${index + 1}`}>
          {`token ${index + 1} ${isRequired ? '(required)' : '(optional)'}`}
        </Label>
        <div className="flex gap-2 items-center">
          <Avatar className="h-8 w-8 flex-shrink-0">
            {isLoading ? (
              <AvatarFallback className="bg-stake-darkbg">
                <Loader className="h-4 w-4 animate-spin" />
              </AvatarFallback>
            ) : data?.imageUrl ? (
              <AvatarImage src={data.imageUrl} alt={data.name} />
            ) : (
              <AvatarFallback className="bg-stake-darkbg text-xs">
                {data?.symbol?.substring(0, 2) || `t${index + 1}`}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-grow">
            <Input
              id={`token${index + 1}`}
              value={address}
              onChange={(e) => updateTokenAddress(index, e.target.value)}
              placeholder="token address"
              className={`rounded-lg w-full ${!isValid ? 'border-red-500' : ''}`}
              required={isRequired}
            />
            {data && (
              <p className="text-xs text-stake-accent mt-1">{data.name}</p>
            )}
            {!isValid && address.length > 0 && (
              <p className="text-xs text-red-500 mt-1">Invalid token address</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-2">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">index name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. fucking mooners"
              className="rounded-lg"
              required
            />
          </div>
          
          {tokens.map((token, index) => renderTokenInput(index, token))}
          
          <Button 
            type="submit" 
            className="w-full btn-solana"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'creating...' : 'create index'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSwapForm;

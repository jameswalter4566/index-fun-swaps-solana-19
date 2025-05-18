
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fetchTokenMetadata, TokenMetadata } from '@/utils/tokenUtils';

interface TokenInputState {
  address: string;
  isLoading: boolean;
  metadata: TokenMetadata | null;
  error: string | null;
}

const CreateSwapForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [tokens, setTokens] = useState<TokenInputState[]>([
    { address: '', isLoading: false, metadata: null, error: null },
    { address: '', isLoading: false, metadata: null, error: null },
    { address: '', isLoading: false, metadata: null, error: null },
    { address: '', isLoading: false, metadata: null, error: null },
  ]);

  const handleAddressChange = async (index: number, address: string) => {
    const newTokens = [...tokens];
    newTokens[index] = {
      address,
      isLoading: address.length > 30, // Only start loading if address looks valid
      metadata: null,
      error: null
    };
    setTokens(newTokens);
    
    // If address looks like a valid Solana address, fetch metadata
    if (address.length > 30) {
      try {
        const metadata = await fetchTokenMetadata(address);
        newTokens[index] = {
          address,
          isLoading: false,
          metadata,
          error: null
        };
        setTokens([...newTokens]);
      } catch (error) {
        newTokens[index] = {
          address,
          isLoading: false,
          metadata: null,
          error: 'Invalid token address'
        };
        setTokens([...newTokens]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !tokens[0].address || !tokens[1].address) {
      toast({
        title: "Form Validation Error",
        description: "INDEX name and at least 2 tokens are required.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Mock submission - in a real app this would interact with Solana
      console.log("Creating INDEX:", {
        name,
        tokens: tokens.filter(t => t.address && t.metadata)
      });
      
      // Show success message
      toast({
        title: "INDEX Created!",
        description: `Your ${name} INDEX has been created successfully.`,
      });
      
      // Navigate back to home page
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error("Error creating INDEX:", error);
      toast({
        title: "Error Creating INDEX",
        description: "There was an error creating your INDEX. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create a New INDEX</CardTitle>
        <CardDescription className="text-center">
          Create a bundle of tokens that people can swap into with a single transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">INDEX Name</Label>
            <Input
              id="name"
              placeholder="e.g., Meme Heroes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg"
              required
            />
          </div>
          
          {tokens.map((token, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`token${index + 1}`}>
                Token {index + 1} {index < 2 ? "(Required)" : "(Optional)"}
              </Label>
              <div>
                <Input
                  id={`token${index + 1}`}
                  placeholder="Token address"
                  value={token.address}
                  onChange={(e) => handleAddressChange(index, e.target.value)}
                  className="rounded-lg mb-1"
                  required={index < 2}
                />
                {token.isLoading && (
                  <p className="text-xs text-stake-muted">Loading token data...</p>
                )}
                {token.metadata && (
                  <div className="flex items-center mt-1">
                    {token.metadata.image && (
                      <img 
                        src={token.metadata.image} 
                        alt={token.metadata.symbol} 
                        className="w-4 h-4 rounded-full mr-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <p className="text-xs text-green-500">
                      {token.metadata.symbol}: {token.metadata.name}
                    </p>
                  </div>
                )}
                {token.error && (
                  <p className="text-xs text-red-500">{token.error}</p>
                )}
              </div>
            </div>
          ))}
          
          <Button 
            type="submit" 
            className="w-full btn-solana"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create INDEX'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSwapForm;

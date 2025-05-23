
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';

const CreateSwapForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { publicKey } = useWallet();
  const [formData, setFormData] = useState({
    name: '',
    token1: '',
    token2: '',
    token3: '',
    token4: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.token1 || !formData.token2) {
      toast({
        title: "Form Validation Error",
        description: "INDEX name and at least 2 tokens are required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create an INDEX.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Collect token addresses
      const tokenAddresses = [
        formData.token1,
        formData.token2,
        formData.token3,
        formData.token4,
      ].filter(token => token.trim() !== '');
      
      // Call edge function to fetch token data
      const { data: tokenData, error: fetchError } = await supabase.functions.invoke('fetch-token-data', {
        body: { tokenAddresses },
      });
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      // Save index to database
      const { data: index, error: insertError } = await supabase
        .from('indexes')
        .insert({
          name: formData.name,
          tokens: tokenData.tokens,
          creator_wallet: publicKey.toString(),
          total_market_cap: tokenData.metrics.totalMarketCap,
          average_market_cap: tokenData.metrics.averageMarketCap,
        })
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      // Show success message
      toast({
        title: "INDEX Created!",
        description: `Your ${formData.name} INDEX has been created successfully.`,
      });
      
      // Navigate to the new index page
      navigate(`/index/${index.id}`);
    } catch (error) {
      console.error("Error creating INDEX:", error);
      toast({
        title: "Error Creating INDEX",
        description: error instanceof Error ? error.message : "There was an error creating your INDEX. Please try again.",
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
              name="name"
              placeholder="e.g., Meme Heroes"
              value={formData.name}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token1">Token 1 (Required)</Label>
            <Input
              id="token1"
              name="token1"
              placeholder="Token address or select from dropdown"
              value={formData.token1}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token2">Token 2 (Required)</Label>
            <Input
              id="token2"
              name="token2"
              placeholder="Token address or select from dropdown"
              value={formData.token2}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token3">Token 3 (Optional)</Label>
            <Input
              id="token3"
              name="token3"
              placeholder="Token address or select from dropdown"
              value={formData.token3}
              onChange={handleChange}
              className="rounded-lg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token4">Token 4 (Optional)</Label>
            <Input
              id="token4"
              name="token4"
              placeholder="Token address or select from dropdown"
              value={formData.token4}
              onChange={handleChange}
              className="rounded-lg"
            />
          </div>
          
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

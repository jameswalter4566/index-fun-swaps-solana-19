import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

const CreateSwapForm: React.FC = () => {
  const { toast: useToastFn } = useToast();
  const { isAuthenticated, userData } = useAuth();
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
      useToastFn({
        title: "form validation error",
        description: "index name and at least 2 tokens are required.",
        variant: "destructive",
      });
      return;
    }

    // Check authentication
    if (!isAuthenticated || !userData) {
      toast("Authentication required", {
        description: "Please connect your wallet to create an index",
        position: "bottom-center",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the index in Supabase
      const { data: indexData, error: indexError } = await supabase
        .from('indexes')
        .insert({
          name: formData.name,
          creator_id: userData.id,
        })
        .select()
        .single();
        
      if (indexError) {
        throw new Error(indexError.message);
      }
      
      // Create tokens and associate them with the index
      const tokens = [
        formData.token1,
        formData.token2,
        formData.token3,
        formData.token4,
      ].filter(Boolean);
      
      // Insert tokens one by one and create index_tokens associations
      for (const tokenAddress of tokens) {
        // Check if token exists
        let { data: existingToken } = await supabase
          .from('tokens')
          .select('*')
          .eq('address', tokenAddress)
          .single();
          
        let tokenId;
        
        if (!existingToken) {
          // Token doesn't exist, create it
          const { data: newToken, error: tokenError } = await supabase
            .from('tokens')
            .insert({
              name: tokenAddress.substring(0, 6), // Placeholder name, would be replaced with real token data
              address: tokenAddress,
            })
            .select()
            .single();
            
          if (tokenError) {
            throw new Error(tokenError.message);
          }
          
          tokenId = newToken.id;
        } else {
          tokenId = existingToken.id;
        }
        
        // Add token to index
        const { error: indexTokenError } = await supabase
          .from('index_tokens')
          .insert({
            index_id: indexData.id,
            token_id: tokenId,
          });
          
        if (indexTokenError) {
          throw new Error(indexTokenError.message);
        }
      }
      
      useToastFn({
        title: "index created!",
        description: `your ${formData.name} index has been created successfully.`,
      });
      
      // Clear form and close drawer
      setFormData({
        name: '',
        token1: '',
        token2: '',
        token3: '',
        token4: '',
      });
      
      // The drawer will close after successful create
      const drawerCloseButton = document.querySelector('[data-drawer-close="true"]') as HTMLButtonElement;
      if (drawerCloseButton) {
        setTimeout(() => drawerCloseButton.click(), 1500);
      }
    } catch (error: any) {
      console.error("Error creating INDEX:", error);
      useToastFn({
        title: "error creating index",
        description: error.message || "there was an error creating your index. please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add placeholder tokens for preview
  const previewTokens = [
    { name: 'Token 1', address: formData.token1 || '0x...', imageUrl: '' },
    { name: 'Token 2', address: formData.token2 || '0x...', imageUrl: '' }
  ];

  if (formData.token3) {
    previewTokens.push({ name: 'Token 3', address: formData.token3, imageUrl: '' });
  }

  if (formData.token4) {
    previewTokens.push({ name: 'Token 4', address: formData.token4, imageUrl: '' });
  }

  return (
    <Card className="mt-2">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">index name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. fucking mooners"
              value={formData.name}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token1">token 1 (required)</Label>
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-stake-darkbg text-xs">t1</AvatarFallback>
              </Avatar>
              <Input
                id="token1"
                name="token1"
                placeholder="token address"
                value={formData.token1}
                onChange={handleChange}
                className="rounded-lg flex-grow"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token2">token 2 (required)</Label>
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-stake-darkbg text-xs">t2</AvatarFallback>
              </Avatar>
              <Input
                id="token2"
                name="token2"
                placeholder="token address"
                value={formData.token2}
                onChange={handleChange}
                className="rounded-lg flex-grow"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token3">token 3 (optional)</Label>
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-stake-darkbg text-xs">t3</AvatarFallback>
              </Avatar>
              <Input
                id="token3"
                name="token3"
                placeholder="token address"
                value={formData.token3}
                onChange={handleChange}
                className="rounded-lg flex-grow"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token4">token 4 (optional)</Label>
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-stake-darkbg text-xs">t4</AvatarFallback>
              </Avatar>
              <Input
                id="token4"
                name="token4"
                placeholder="token address"
                value={formData.token4}
                onChange={handleChange}
                className="rounded-lg flex-grow"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn-solana"
            disabled={isSubmitting || !isAuthenticated}
          >
            {isSubmitting ? 'creating...' : isAuthenticated ? 'create index' : 'connect wallet to create'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSwapForm;

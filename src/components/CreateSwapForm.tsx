
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

const CreateSwapForm: React.FC = () => {
  const { toast } = useToast();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  
  const [formData, setFormData] = useState({
    name: '',
    token1: '',
    token2: '',
    token3: '',
    token4: '',
    // We could potentially add token image URLs here as well
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if wallet is connected
    if (!connected) {
      toast({
        title: "wallet not connected",
        description: "please connect your wallet to create an index",
        variant: "destructive",
      });
      setVisible(true);
      return;
    }
    
    // Validate form
    if (!formData.name || !formData.token1 || !formData.token2) {
      toast({
        title: "form validation error",
        description: "index name and at least 2 tokens are required.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Mock submission - in a real app this would interact with Solana
      console.log("Creating INDEX:", formData);
      
      // Show success message
      toast({
        title: "index created!",
        description: `your ${formData.name} index has been created successfully.`,
      });
      
      // Clear form and close drawer (relies on parent component)
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

  // Add placeholder tokens for preview
  const previewTokens = [
    { name: 'token 1', address: formData.token1 || '0x...', imageUrl: '' },
    { name: 'token 2', address: formData.token2 || '0x...', imageUrl: '' }
  ];

  if (formData.token3) {
    previewTokens.push({ name: 'token 3', address: formData.token3, imageUrl: '' });
  }

  if (formData.token4) {
    previewTokens.push({ name: 'token 4', address: formData.token4, imageUrl: '' });
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

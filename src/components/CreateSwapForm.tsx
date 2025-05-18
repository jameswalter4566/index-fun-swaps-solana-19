
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const CreateSwapForm: React.FC = () => {
  const { toast } = useToast();
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
    
    // Validate form
    if (!formData.name || !formData.token1 || !formData.token2) {
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
      console.log("Creating INDEX:", formData);
      
      // Show success message
      toast({
        title: "INDEX Created!",
        description: `Your ${formData.name} INDEX has been created successfully.`,
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
        title: "Error Creating INDEX",
        description: "There was an error creating your INDEX. Please try again.",
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
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-stake-darkbg text-xs">T1</AvatarFallback>
              </Avatar>
              <Input
                id="token1"
                name="token1"
                placeholder="Token address or select from dropdown"
                value={formData.token1}
                onChange={handleChange}
                className="rounded-lg flex-grow"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token2">Token 2 (Required)</Label>
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-stake-darkbg text-xs">T2</AvatarFallback>
              </Avatar>
              <Input
                id="token2"
                name="token2"
                placeholder="Token address or select from dropdown"
                value={formData.token2}
                onChange={handleChange}
                className="rounded-lg flex-grow"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token3">Token 3 (Optional)</Label>
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-stake-darkbg text-xs">T3</AvatarFallback>
              </Avatar>
              <Input
                id="token3"
                name="token3"
                placeholder="Token address or select from dropdown"
                value={formData.token3}
                onChange={handleChange}
                className="rounded-lg flex-grow"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token4">Token 4 (Optional)</Label>
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-stake-darkbg text-xs">T4</AvatarFallback>
              </Avatar>
              <Input
                id="token4"
                name="token4"
                placeholder="Token address or select from dropdown"
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
            {isSubmitting ? 'Creating...' : 'Create INDEX'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSwapForm;

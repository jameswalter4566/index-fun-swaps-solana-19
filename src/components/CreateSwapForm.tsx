import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CreateSwapForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    twitter1: '',
    twitter2: '',
    twitter3: '',
    twitter4: '',
    phoneNumber: '',
  });
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.twitter1 || !formData.twitter2 || !formData.twitter3 || !formData.twitter4) {
      toast({
        title: "Form Validation Error",
        description: "Agent name and all 4 Twitter accounts are required.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number if provided
    if (formData.phoneNumber && !smsOptIn) {
      toast({
        title: "SMS Opt-in Required",
        description: "Please check the box to opt-in to SMS notifications.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Collect Twitter accounts
      const twitterAccounts = [
        formData.twitter1,
        formData.twitter2,
        formData.twitter3,
        formData.twitter4,
      ].filter(account => account.trim() !== '');
      
      // For now, we'll save the agent data as an index with Twitter accounts
      // In a real implementation, this would be a separate table
      const { data: agent, error: insertError } = await supabase
        .from('indexes')
        .insert({
          name: formData.name,
          tokens: twitterAccounts.map(account => ({
            name: account,
            address: account, // Using Twitter handle as address for now
            symbol: account.replace('@', ''),
          })),
          creator_wallet: 'anonymous',
          // Store phone number in metadata if provided
          metadata: formData.phoneNumber ? {
            phoneNumber: formData.phoneNumber,
            smsOptIn: smsOptIn,
          } : undefined,
        })
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      // Show success message
      toast({
        title: "Agent Created!",
        description: `Your ${formData.name} agent has been created successfully.`,
      });
      
      // Navigate to the new agent page
      navigate(`/index/${agent.id}`);
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        title: "Error Creating Agent",
        description: error instanceof Error ? error.message : "There was an error creating your agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">create a new agent</CardTitle>
        <CardDescription className="text-center">
          create an AI trading agent that monitors Twitter accounts for trading signals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">agent name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., meme coin hunter"
              value={formData.name}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitter1">Twitter account 1</Label>
            <Input
              id="twitter1"
              name="twitter1"
              placeholder="@username"
              value={formData.twitter1}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitter2">Twitter account 2</Label>
            <Input
              id="twitter2"
              name="twitter2"
              placeholder="@username"
              value={formData.twitter2}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitter3">Twitter account 3</Label>
            <Input
              id="twitter3"
              name="twitter3"
              placeholder="@username"
              value={formData.twitter3}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitter4">Twitter account 4</Label>
            <Input
              id="twitter4"
              name="twitter4"
              placeholder="@username"
              value={formData.twitter4}
              onChange={handleChange}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone number (optional)</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="rounded-lg"
            />
          </div>
          
          {formData.phoneNumber && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="smsOptIn"
                checked={smsOptIn}
                onCheckedChange={(checked) => setSmsOptIn(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="smsOptIn" className="text-sm font-normal cursor-pointer">
                  I agree to receive SMS notifications about my agent's trading activities
                </Label>
                <p className="text-xs text-muted-foreground">
                  Message and data rates may apply. Text STOP to unsubscribe. View our{' '}
                  <Link to="/privacy" className="underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full btn-solana"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'creating...' : 'create agent'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSwapForm;
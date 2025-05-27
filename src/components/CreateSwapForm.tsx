import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/glass-card';
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
        description: "Guardian name and all 4 Twitter accounts are required.",
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
      
      // Fetch Twitter user data
      console.log('Fetching Twitter user data for:', twitterAccounts);
      const { data: twitterData, error: twitterError } = await supabase.functions.invoke('get-twitter-users', {
        body: { usernames: twitterAccounts },
      });
      
      if (twitterError) {
        throw new Error(`Failed to fetch Twitter users: ${twitterError.message}`);
      }
      
      // Ensure we have valid Twitter data
      if (!twitterData || !twitterData.users) {
        throw new Error('Invalid Twitter data received');
      }

      console.log('Twitter data received:', twitterData);

      // Prepare the data to insert - storing metadata in tokens for now
      const indexData = {
        name: formData.name,
        tokens: twitterData.users.map((user: any) => ({
          name: `@${user.username}`,
          address: user.username,
          symbol: user.username,
          image: user.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          metadata: {
            twitter_id: user.id,
            display_name: user.name,
            description: user.description || '',
            verified: user.verified || false,
            verified_type: user.verified_type,
            followers_count: user.followers_count || 0,
            following_count: user.following_count || 0,
            tweet_count: user.tweet_count || 0,
            listed_count: user.listed_count || 0,
          }
        })),
        creator_wallet: 'anonymous',
        total_market_cap: 0,
        average_market_cap: 0,
      };

      console.log('Data to insert:', JSON.stringify(indexData, null, 2));

      // Save guardian data with Twitter user information
      const { data: guardian, error: insertError } = await supabase
        .from('indexes')
        .insert(indexData)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      // Show success message
      toast({
        title: "Guardian Created!",
        description: `Your ${formData.name} guardian has been created successfully.`,
      });
      
      // Navigate to the new guardian page
      navigate(`/guardian/${guardian.id}`);
    } catch (error) {
      console.error("Error creating guardian:", error);
      toast({
        title: "Error Creating Guardian",
        description: error instanceof Error ? error.message : "There was an error creating your guardian. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="max-w-lg mx-auto" glow>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">create a new guardian</h2>
        <p className="text-muted-foreground">
          create an AI trading guardian that monitors Twitter accounts for trading signals
        </p>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">guardian name</Label>
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
            <Label htmlFor="phoneNumber">Phone number for SMS updates (optional)</Label>
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
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="smsOptIn"
              checked={smsOptIn}
              onCheckedChange={(checked) => setSmsOptIn(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="smsOptIn" className="text-sm font-normal cursor-pointer">
                I consent to receive SMS notifications about my guardian's trading activities
              </Label>
              <p className="text-xs text-muted-foreground">
                Message and data rates may apply. Text STOP to unsubscribe. View our{' '}
                <Link to="/privacy" className="underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn-solana"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'creating...' : 'create guardian'}
          </Button>
        </form>
      </div>
    </GlassCard>
  );
};

export default CreateSwapForm;
import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Twitter, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface TwitterMention {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
  };
  createdAt: string;
}

interface AccountMentions {
  username: string;
  mentions: TwitterMention[];
}

interface KOLFeedProps {
  tokens: Array<{
    name: string;
    address: string;
    metadata?: any;
  }>;
  agentId: string;
}

const KOLFeed: React.FC<KOLFeedProps> = ({ tokens, agentId }) => {
  const [mentions, setMentions] = useState<AccountMentions[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchMentions = async () => {
    setLoading(true);
    
    try {
      // Extract Twitter usernames from tokens
      const twitterUsernames = tokens
        .filter(token => token.name?.startsWith('@'))
        .map(token => token.name);

      if (twitterUsernames.length === 0) {
        toast({
          title: 'No Twitter Accounts',
          description: 'This agent is not monitoring any Twitter accounts.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Fetching mentions for:', twitterUsernames);

      const { data, error } = await supabase.functions.invoke('get-twitter-mentions', {
        body: {
          usernames: twitterUsernames,
          limit: 5, // 5 most recent tweets per account
        },
      });

      if (error) throw error;

      if (data?.mentions) {
        setMentions(data.mentions);
        setLastRefreshed(new Date());
        
        // Show success toast
        const totalMentions = data.mentions.reduce(
          (acc: number, account: AccountMentions) => acc + account.mentions.length, 
          0
        );
        
        toast({
          title: 'Feed Updated',
          description: `Loaded ${totalMentions} recent tweets from ${twitterUsernames.length} accounts.`,
        });
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
      toast({
        title: 'Error Loading Feed',
        description: 'Failed to fetch Twitter mentions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const highlightMentions = (text: string) => {
    // Highlight @mentions and $tickers
    const parts = text.split(/(@\w+|\$\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') || part.startsWith('$')) {
        return (
          <span key={index} className="text-stake-accent font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const formatTimestamp = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <GlassCard className="w-full" glow>
      <div className="flex flex-row items-center justify-between mb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Twitter className="h-5 w-5" />
            KOL Feed
          </h3>
          {lastRefreshed && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated {formatTimestamp(lastRefreshed.toISOString())}
            </p>
          )}
        </div>
        <Button
          onClick={fetchMentions}
          disabled={loading}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="p-0">
        {mentions.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Twitter className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Click refresh to load tweets from monitored accounts</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-stake-accent" />
            <p className="text-muted-foreground">Loading tweets...</p>
          </div>
        )}

        {mentions.length > 0 && (
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-6">
              {mentions.map((account) => (
                <div key={account.username} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-stake-card">
                    <Badge variant="outline" className="gap-1">
                      <Twitter className="h-3 w-3" />
                      @{account.username}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {account.mentions.length} recent tweets
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {account.mentions.map((mention) => (
                      <div
                        key={mention.id}
                        className="bg-gray-800 rounded-lg p-4 hover:bg-stake-darkbg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={mention.author.profile_image_url} 
                              alt={mention.author.name}
                            />
                            <AvatarFallback>
                              {mention.author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm">
                                  {mention.author.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  @{mention.author.username}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(mention.createdAt)}
                              </span>
                            </div>
                            
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {highlightMentions(mention.text)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </GlassCard>
  );
};

export default KOLFeed;
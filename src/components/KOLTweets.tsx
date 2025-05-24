import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Twitter, Clock, Heart, MessageCircle, Repeat2, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    name: string;
    verified?: boolean;
    profile_image_url?: string;
  };
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
  };
}

interface KOLTweetsProps {
  tokens: Array<{
    name: string;
    address: string;
    metadata?: any;
  }>;
  agentId: string;
}

const KOLTweets: React.FC<KOLTweetsProps> = ({ tokens, agentId }) => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchTweets = async () => {
    setLoading(true);
    
    try {
      // Extract unique Twitter usernames from tokens
      const twitterUsernames = [...new Set(
        tokens
          .filter(token => token.name?.startsWith('@'))
          .map(token => token.name)
      )];

      if (twitterUsernames.length === 0) {
        toast({
          title: 'No Twitter Accounts',
          description: 'This agent is not monitoring any Twitter accounts.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Fetching tweets for usernames:', twitterUsernames);

      const { data, error } = await supabase.functions.invoke('retrieve-new-tweets', {
        body: {
          usernames: twitterUsernames,
          agentId: agentId,
        },
      });

      if (error) throw error;

      if (data?.tweets) {
        setTweets(data.tweets);
        setLastRefreshed(new Date());
        
        // Show success toast with source info
        const sourceInfo = data.source === 'cache' ? ' (from cache)' : '';
        toast({
          title: 'Tweets Loaded',
          description: `Loaded ${data.tweets.length} tweets from ${twitterUsernames.length} accounts${sourceInfo}.`,
        });
        
        // Show any errors/warnings
        if (data.errors && data.errors.length > 0) {
          console.warn('Tweet fetch warnings:', data.errors);
          toast({
            title: 'Some accounts had issues',
            description: data.errors[0],
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
      
      // Provide more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error Loading Tweets',
        description: `Failed to fetch tweets: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const highlightMentions = (text: string) => {
    // Highlight @mentions, $tickers, and #hashtags
    const parts = text.split(/(@\w+|\$\w+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') || part.startsWith('$') || part.startsWith('#')) {
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

  const formatEngagement = (count: number | undefined) => {
    if (!count && count !== 0) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            KOL Tweets
          </CardTitle>
          {lastRefreshed && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated {formatTimestamp(lastRefreshed.toISOString())}
            </p>
          )}
        </div>
        <Button
          onClick={fetchTweets}
          disabled={loading}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        {tweets.length === 0 && !loading && (
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

        {tweets.length > 0 && (
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-4">
              {tweets.map((tweet, index) => (
                <div
                  key={`${tweet.id}-${index}`}
                  className="bg-stake-card rounded-lg p-4 hover:bg-stake-darkbg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={tweet.author.profile_image_url} 
                        alt={tweet.author.name}
                      />
                      <AvatarFallback>
                        {tweet.author.name ? tweet.author.name.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm">
                            {tweet.author?.name || 'Unknown'}
                          </span>
                          {tweet.author.verified && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                          )}
                          <span className="text-xs text-muted-foreground">
                            @{tweet.author?.username || 'unknown'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(tweet.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {highlightMentions(tweet.text)}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        <span className="flex items-center gap-1 hover:text-red-500 cursor-pointer">
                          <Heart className="h-3 w-3" />
                          {formatEngagement(tweet.metrics?.likes)}
                        </span>
                        <span className="flex items-center gap-1 hover:text-green-500 cursor-pointer">
                          <Repeat2 className="h-3 w-3" />
                          {formatEngagement(tweet.metrics?.retweets)}
                        </span>
                        <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer">
                          <MessageCircle className="h-3 w-3" />
                          {formatEngagement(tweet.metrics?.replies)}
                        </span>
                        <span className="flex items-center gap-1 hover:text-purple-500 cursor-pointer">
                          <Quote className="h-3 w-3" />
                          {formatEngagement(tweet.metrics?.quotes)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default KOLTweets;
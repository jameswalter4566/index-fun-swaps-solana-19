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
    profile_image_url?: string;
  };
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
  };
}

interface UserTweets {
  userId: string;
  username?: string;
  name?: string;
  profile_image_url?: string;
  tweets: Tweet[];
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
  const [userTweets, setUserTweets] = useState<UserTweets[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchTweets = async () => {
    setLoading(true);
    
    try {
      // Extract Twitter user IDs from token metadata
      const twitterUserIds = tokens
        .filter(token => {
          // Check if it's a Twitter account and has valid metadata
          return token.name?.startsWith('@') && 
                 token.metadata && 
                 (token.metadata.twitter_id || token.metadata.id);
        })
        .map(token => token.metadata.twitter_id || token.metadata.id);

      if (twitterUserIds.length === 0) {
        // Try to use mock user IDs if no real Twitter IDs found
        console.log('No Twitter IDs found in metadata, using mock data');
        const mockUserIds = tokens
          .filter(token => token.name?.startsWith('@'))
          .map((_, index) => `mock-user-${index + 1}`);
        
        if (mockUserIds.length === 0) {
          toast({
            title: 'No Twitter Accounts',
            description: 'This agent is not monitoring any Twitter accounts.',
            variant: 'destructive',
          });
          return;
        }

        // Use mock user IDs instead
        const { data, error } = await supabase.functions.invoke('get-tweets', {
          body: {
            userIds: mockUserIds,
            limit: 10,
          },
        });

        if (error) throw error;

        if (data?.tweets) {
          setUserTweets(data.tweets);
          setLastRefreshed(new Date());
          toast({
            title: 'Tweets Loaded',
            description: `Loaded mock tweets for demonstration.`,
          });
        }
        return;
      }

      console.log('Fetching tweets for user IDs:', twitterUserIds);

      const { data, error } = await supabase.functions.invoke('get-tweets', {
        body: {
          userIds: twitterUserIds,
          limit: 10, // 10 most recent tweets per account
        },
      });

      if (error) throw error;

      if (data?.tweets) {
        setUserTweets(data.tweets);
        setLastRefreshed(new Date());
        
        // Show success toast
        const totalTweets = data.tweets.reduce(
          (acc: number, user: UserTweets) => acc + user.tweets.length, 
          0
        );
        
        toast({
          title: 'Tweets Loaded',
          description: `Loaded ${totalTweets} tweets from ${twitterUserIds.length} accounts.`,
        });
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

  const formatEngagement = (count: number) => {
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
        {userTweets.length === 0 && !loading && (
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

        {userTweets.length > 0 && (
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-6">
              {userTweets.map((user) => (
                <div key={user.userId} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-stake-card">
                    {user.profile_image_url && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.profile_image_url} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    )}
                    <Badge variant="outline" className="gap-1">
                      <Twitter className="h-3 w-3" />
                      @{user.username || 'unknown'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {user.tweets.length} tweets
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {user.tweets.map((tweet) => (
                      <div
                        key={tweet.id}
                        className="bg-stake-card rounded-lg p-4 hover:bg-stake-darkbg transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={tweet.author.profile_image_url} 
                              alt={tweet.author.name}
                            />
                            <AvatarFallback>
                              {tweet.author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm">
                                  {tweet.author.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  @{tweet.author.username}
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
                                {formatEngagement(tweet.engagement.likes)}
                              </span>
                              <span className="flex items-center gap-1 hover:text-green-500 cursor-pointer">
                                <Repeat2 className="h-3 w-3" />
                                {formatEngagement(tweet.engagement.retweets)}
                              </span>
                              <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer">
                                <MessageCircle className="h-3 w-3" />
                                {formatEngagement(tweet.engagement.replies)}
                              </span>
                              <span className="flex items-center gap-1 hover:text-purple-500 cursor-pointer">
                                <Quote className="h-3 w-3" />
                                {formatEngagement(tweet.engagement.quotes)}
                              </span>
                            </div>
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
      </CardContent>
    </Card>
  );
};

export default KOLTweets;

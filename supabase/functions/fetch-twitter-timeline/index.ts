import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  verified?: boolean;
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface TwitterAPIResponse {
  data?: Tweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
  };
  errors?: Array<{
    detail: string;
    title: string;
    type: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Twitter Bearer Token from environment
    const bearerToken = Deno.env.get('X_API_BEARER_TOKEN');

    if (!bearerToken) {
      console.error('Missing Twitter Bearer Token');
      return new Response(
        JSON.stringify({ 
          error: 'Twitter Bearer Token not configured',
          message: 'Please set X_API_BEARER_TOKEN'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { usernames, agentId, count = 10 } = await req.json();
    
    console.log('Fetching tweets for:', { usernames, agentId, count });
    
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'usernames array is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Remove @ symbols if present
    const cleanUsernames = usernames.map(u => u.replace('@', ''));
    
    // Check cache first (last 2 hours)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    const { data: cachedTweets, error: dbError } = await supabase
      .from('kol_tweets')
      .select('*')
      .in('author_username', cleanUsernames)
      .gte('fetched_at', twoHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbError) {
      console.error('Database error:', dbError);
    }

    const usersWithCache = new Set(cachedTweets?.map(t => t.author_username) || []);
    const usersToFetch = cleanUsernames.filter(u => !usersWithCache.has(u));

    console.log('Cache status:', { usersWithCache: Array.from(usersWithCache), usersToFetch });

    const allTweets = [];
    const errors = [];

    // Add cached tweets
    if (cachedTweets && cachedTweets.length > 0) {
      allTweets.push(...cachedTweets.map(tweet => ({
        id: tweet.tweet_id,
        text: tweet.tweet_text,
        created_at: tweet.created_at,
        author: {
          id: tweet.author_id,
          username: tweet.author_username,
          name: tweet.author_name,
          verified: tweet.author_verified,
          profile_image_url: tweet.author_profile_image_url
        },
        metrics: tweet.metrics,
        source: 'cache'
      })));
    }

    // First, get user IDs from usernames
    const userIdMap = new Map<string, TwitterUser>();
    
    if (usersToFetch.length > 0) {
      try {
        console.log('Getting user IDs for:', usersToFetch);
        
        // Twitter v2 API allows up to 100 usernames in a single request
        const usernamesParam = usersToFetch.join(',');
        const userLookupUrl = `https://api.twitter.com/2/users/by?usernames=${usernamesParam}&user.fields=id,name,username,profile_image_url,verified`;
        
        const userResponse = await fetch(userLookupUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.data) {
            userData.data.forEach((user: TwitterUser) => {
              userIdMap.set(user.username.toLowerCase(), user);
            });
          }
        } else {
          const errorText = await userResponse.text();
          console.error('Error fetching user data:', userResponse.status, errorText);
          errors.push('Failed to fetch user information');
        }
      } catch (error) {
        console.error('Error looking up users:', error);
        errors.push(`Error looking up users: ${error.message}`);
      }
    }

    // Fetch new tweets for users without cache
    for (const username of usersToFetch) {
      try {
        const user = userIdMap.get(username.toLowerCase());
        if (!user) {
          console.error(`User not found: ${username}`);
          errors.push(`User not found: ${username}`);
          continue;
        }

        console.log(`Fetching tweets for @${username} (ID: ${user.id}) from Twitter API v2`);
        
        // Build Twitter API v2 URL for user tweets
        const twitterUrl = new URL(`https://api.twitter.com/2/users/${user.id}/tweets`);
        twitterUrl.searchParams.append('max_results', Math.min(count, 100).toString());
        twitterUrl.searchParams.append('tweet.fields', 'created_at,author_id,public_metrics');
        twitterUrl.searchParams.append('exclude', 'retweets,replies');
        
        console.log('Making request to Twitter API v2...');
        const response = await fetch(twitterUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Twitter API error for ${username}:`, response.status, errorText);
          errors.push(`Failed to fetch ${username}: ${response.status}`);
          continue;
        }

        const twitterData: TwitterAPIResponse = await response.json();
        console.log(`Got ${twitterData.data?.length || 0} tweets for ${username}`);
        
        if (twitterData.data && twitterData.data.length > 0) {
          // Save tweets to database
          const tweetsToInsert = twitterData.data.map((tweet: Tweet) => ({
            tweet_id: tweet.id,
            author_id: user.id,
            author_username: user.username,
            author_name: user.name,
            author_verified: user.verified || false,
            author_profile_image_url: user.profile_image_url,
            tweet_text: tweet.text,
            created_at: tweet.created_at,
            metrics: {
              likes: tweet.public_metrics?.like_count || 0,
              retweets: tweet.public_metrics?.retweet_count || 0,
              replies: tweet.public_metrics?.reply_count || 0,
              quotes: tweet.public_metrics?.quote_count || 0
            },
            agent_ids: agentId ? [agentId] : [],
            fetched_at: new Date().toISOString()
          }));

          // Upsert tweets
          const { error: insertError } = await supabase
            .from('kol_tweets')
            .upsert(tweetsToInsert, { 
              onConflict: 'tweet_id',
              ignoreDuplicates: false 
            });

          if (insertError) {
            console.error('Error saving tweets:', insertError);
          }

          // Add to results
          allTweets.push(...tweetsToInsert.map((t: any) => ({
            id: t.tweet_id,
            text: t.tweet_text,
            created_at: t.created_at,
            author: {
              id: t.author_id,
              username: t.author_username,
              name: t.author_name,
              verified: t.author_verified,
              profile_image_url: t.author_profile_image_url
            },
            metrics: t.metrics,
            source: 'api'
          })));
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing ${username}:`, error);
        errors.push(`Error processing ${username}: ${error.message}`);
      }
    }

    // Sort by date
    allTweets.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Update agent associations for cached tweets
    if (agentId && cachedTweets) {
      for (const tweet of cachedTweets) {
        await supabase.rpc('add_agent_to_tweet', {
          p_tweet_id: tweet.tweet_id,
          p_agent_id: agentId
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        tweets: allTweets.slice(0, 50),
        count: allTweets.length,
        source: usersToFetch.length > 0 ? 'mixed' : 'cache',
        errors: errors.length > 0 ? errors : undefined,
        debug: {
          usersWithCache: Array.from(usersWithCache),
          usersToFetch
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-twitter-timeline:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        tweets: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
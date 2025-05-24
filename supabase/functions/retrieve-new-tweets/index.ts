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
  username: string;
  name: string;
  verified: boolean;
  profile_image_url?: string;
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author: TwitterUser;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
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
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const bearerToken = Deno.env.get('X_API_BEARER_TOKEN');
    if (!bearerToken) {
      throw new Error('X API bearer token not configured. Please set X_API_BEARER_TOKEN in Supabase environment variables.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { usernames, agentId, forceFresh = false } = await req.json();
    
    console.log('Request received:', { usernames, agentId, forceFresh });
    
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
    
    // First, try to get tweets from our database (fetched in last 2 hours)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    const { data: cachedTweets, error: dbError } = await supabase
      .from('kol_tweets')
      .select('*')
      .in('author_username', cleanUsernames)
      .gte('fetched_at', twoHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Check if we have recently fetched tweets for all users
    const usersWithRecentTweets = new Set(cachedTweets?.map(t => t.author_username) || []);
    const usersNeedingFetch = cleanUsernames.filter(u => !usersWithRecentTweets.has(u));

    console.log('Users with recent tweets:', Array.from(usersWithRecentTweets));
    console.log('Users needing fetch:', usersNeedingFetch);

    // If we have recently fetched tweets for all users AND not forcing fresh, return cached data
    if (!forceFresh && usersNeedingFetch.length === 0 && cachedTweets && cachedTweets.length > 0) {
      // Update agent_ids for these tweets if needed
      if (agentId) {
        for (const tweet of cachedTweets) {
          await supabase.rpc('add_agent_to_tweet', {
            p_tweet_id: tweet.tweet_id,
            p_agent_id: agentId
          });
        }
      }

      const formattedTweets = cachedTweets.map(tweet => ({
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
        metrics: tweet.metrics
      }));

      return new Response(
        JSON.stringify({ 
          success: true,
          tweets: formattedTweets.slice(0, 20), // Return max 20 tweets from cache
          count: formattedTweets.length,
          source: 'cache',
          message: 'Returning cached tweets fetched within last 2 hours'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Otherwise, fetch from Twitter API for users that need updates
    const allTweets: Tweet[] = [];
    const errors: string[] = [];
    
    // Add recently fetched cached tweets to results
    if (cachedTweets && cachedTweets.length > 0 && usersNeedingFetch.length < cleanUsernames.length) {
      const cachedFormattedTweets = cachedTweets.map(tweet => ({
        id: tweet.tweet_id,
        text: tweet.tweet_text,
        created_at: tweet.created_at,
        author_id: tweet.author_id,
        author: {
          id: tweet.author_id,
          username: tweet.author_username,
          name: tweet.author_name,
          verified: tweet.author_verified,
          profile_image_url: tweet.author_profile_image_url
        },
        public_metrics: tweet.metrics
      }));
      allTweets.push(...cachedFormattedTweets);
    }

    // Fetch new tweets for users that need updates
    for (const username of usersNeedingFetch) {
      try {
        console.log(`Fetching new tweets for user: ${username}`);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // First, get user info
        const userResponse = await fetch(
          `https://api.twitter.com/2/users/by/username/${username}?user.fields=id,name,username,verified,profile_image_url`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (userResponse.status === 429) {
          const resetTime = userResponse.headers.get('x-rate-limit-reset');
          errors.push(`Rate limited for ${username}. Reset at: ${resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleString() : 'unknown'}`);
          continue;
        }

        if (!userResponse.ok) {
          errors.push(`Failed to fetch user ${username}: ${userResponse.status}`);
          continue;
        }

        const userData = await userResponse.json();
        if (!userData.data) {
          errors.push(`User ${username} not found`);
          continue;
        }

        const user = userData.data as TwitterUser;

        // Fetch tweets for this user
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${user.id}/tweets?max_results=5&tweet.fields=created_at,author_id,public_metrics`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (tweetsResponse.status === 429) {
          const resetTime = tweetsResponse.headers.get('x-rate-limit-reset');
          errors.push(`Rate limited for tweets of ${username}. Reset at: ${resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleString() : 'unknown'}`);
          continue;
        }

        if (!tweetsResponse.ok) {
          errors.push(`Failed to fetch tweets for ${username}: ${tweetsResponse.status}`);
          continue;
        }

        const tweetsData = await tweetsResponse.json();
        
        if (tweetsData.data && Array.isArray(tweetsData.data)) {
          // Save tweets to database
          const tweetsToInsert = tweetsData.data.map((tweet: any) => ({
            tweet_id: tweet.id,
            author_id: user.id,
            author_username: user.username,
            author_name: user.name,
            author_verified: user.verified || false,
            author_profile_image_url: user.profile_image_url,
            tweet_text: tweet.text,
            created_at: tweet.created_at,
            metrics: {
              likes: tweet.public_metrics.like_count,
              retweets: tweet.public_metrics.retweet_count,
              replies: tweet.public_metrics.reply_count,
              quotes: tweet.public_metrics.quote_count
            },
            agent_ids: agentId ? [agentId] : [],
            fetched_at: new Date().toISOString()
          }));

          // Upsert tweets (insert or update)
          const { error: insertError } = await supabase
            .from('kol_tweets')
            .upsert(tweetsToInsert, { 
              onConflict: 'tweet_id',
              ignoreDuplicates: false 
            });

          if (insertError) {
            console.error('Error saving tweets:', insertError);
          }

          // Add to results with author info
          const tweetsWithAuthor = tweetsData.data.map((tweet: any) => ({
            ...tweet,
            author: user
          }));
          
          allTweets.push(...tweetsWithAuthor);
        }
      } catch (error) {
        console.error(`Error processing ${username}:`, error);
        errors.push(`Error processing ${username}: ${error.message}`);
      }
    }

    // Sort all tweets by creation date (newest first)
    allTweets.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Format the response
    const formattedTweets = allTweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text || tweet.tweet_text,
      created_at: tweet.created_at,
      author: tweet.author,
      metrics: tweet.public_metrics || tweet.metrics
    }));

    return new Response(
      JSON.stringify({ 
        success: true,
        tweets: formattedTweets.slice(0, 50), // Return max 50 tweets
        count: formattedTweets.length,
        source: usersNeedingFetch.length > 0 ? 'api' : 'cache',
        errors: errors.length > 0 ? errors : undefined,
        fetchedUsers: usersNeedingFetch,
        cachedUsers: Array.from(usersWithRecentTweets)
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in retrieve-new-tweets function:', error);
    
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
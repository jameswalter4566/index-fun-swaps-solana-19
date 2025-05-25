import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// OAuth 1.0a signature generation for Twitter API v1.1
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  
  const signingKey = `${encodeURIComponent(
    consumerSecret
  )}&${encodeURIComponent(tokenSecret)}`;
  
  const hmac = createHmac("sha1", signingKey);
  const signature = hmac.update(signatureBaseString).digest("base64");
  
  return signature;
}

function generateOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // Combine OAuth params with request params for signature
  const allParams = { ...oauthParams, ...params };

  const signature = generateOAuthSignature(
    method,
    url,
    allParams,
    apiSecret,
    accessTokenSecret
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const entries = Object.entries(signedOAuthParams).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    "OAuth " +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
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

    // Get Twitter OAuth 1.0a credentials from environment
    const apiKey = Deno.env.get('TWITTER_API_KEY');
    const apiSecret = Deno.env.get('TWITTER_API_SECRET');
    const accessToken = Deno.env.get('TWITTER_ACCESS_TOKEN');
    const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      console.error('Missing Twitter OAuth credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Twitter OAuth credentials not configured',
          message: 'Please set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET'
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

    // Fetch new tweets for users without cache
    for (const username of usersToFetch) {
      try {
        console.log(`Fetching tweets for @${username} from Twitter API v1.1`);
        
        const baseUrl = "https://api.twitter.com/1.1/statuses/user_timeline.json";
        const params = {
          screen_name: username,
          count: count.toString(),
          tweet_mode: "extended",
          exclude_replies: "false",
          include_rts: "true"
        };
        
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${baseUrl}?${queryString}`;
        
        const oauthHeader = generateOAuthHeader(
          "GET",
          baseUrl,
          params,
          apiKey,
          apiSecret,
          accessToken,
          accessTokenSecret
        );
        
        console.log('Making request to Twitter API v1.1...');
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "Authorization": oauthHeader,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Twitter API error for ${username}:`, response.status, errorText);
          errors.push(`Failed to fetch ${username}: ${response.status}`);
          continue;
        }

        const tweets = await response.json();
        console.log(`Got ${tweets.length} tweets for ${username}`);
        
        if (tweets.length > 0) {
          // Get user info from first tweet
          const user = tweets[0].user;
          
          // Save tweets to database
          const tweetsToInsert = tweets.map((tweet: any) => ({
            tweet_id: tweet.id_str,
            author_id: user.id_str,
            author_username: user.screen_name,
            author_name: user.name,
            author_verified: user.verified || false,
            author_profile_image_url: user.profile_image_url_https,
            tweet_text: tweet.full_text || tweet.text,
            created_at: new Date(tweet.created_at).toISOString(),
            metrics: {
              likes: tweet.favorite_count || 0,
              retweets: tweet.retweet_count || 0,
              replies: tweet.reply_count || 0,
              quotes: tweet.quote_count || 0
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
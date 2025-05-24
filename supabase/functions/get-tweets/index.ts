import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Define CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
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
}

// Generate mock tweets as fallback
function generateMockTweets(userId: string, count: number = 10) {
  const mockTexts = [
    "Just launched our new AI trading agent! 🚀 It's analyzing market patterns 24/7",
    "The $PEPE community is stronger than ever. Holding through the dips 💎🙌",
    "New ATH incoming? Chart patterns looking bullish 📈",
    "Remember: DYOR, NFA. But this setup looks promising...",
    "Airdrop season is here! Make sure you're eligible 🪂",
    "Market correction = buying opportunity. Who's accumulating? 🛒",
    "That feeling when your AI agent catches a 10x before anyone else 🤖💰",
    "Breaking: Major partnership announcement coming next week 👀",
    "Gas fees are finally reasonable. Time to make some moves! ⛽",
    "Portfolio update: Still bullish on the long term vision 📊"
  ];
  
  const tweets = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 72)); // Random time in last 3 days
    
    tweets.push({
      id: `mock-${userId}-${Date.now()}-${i}`,
      text: mockTexts[i % mockTexts.length],
      created_at: date.toISOString(),
      author: {
        id: userId,
        username: `user_${userId}`,
        name: `Mock User ${userId}`,
        profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      },
      engagement: {
        likes: Math.floor(Math.random() * 1000),
        retweets: Math.floor(Math.random() * 200),
        replies: Math.floor(Math.random() * 50),
        quotes: Math.floor(Math.random() * 20),
      }
    });
  }
  
  // Sort by date descending (newest first)
  return tweets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// Format Twitter API response to match our expected data structure
function formatTwitterResponse(twitterData: TwitterAPIResponse, userId: string) {
  if (!twitterData.data || twitterData.data.length === 0) {
    return [];
  }
  
  const author = twitterData.includes?.users?.[0];
  
  return twitterData.data.map(tweet => ({
    id: tweet.id,
    text: tweet.text,
    created_at: tweet.created_at,
    author: {
      id: author?.id || userId,
      username: author?.username || 'unknown',
      name: author?.name || 'Unknown User',
      profile_image_url: author?.profile_image_url
    },
    engagement: {
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
      replies: tweet.public_metrics?.reply_count || 0,
      quotes: tweet.public_metrics?.quote_count || 0,
    }
  }));
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  
  try {
    const { userIds, limit = 10 } = await req.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Twitter user IDs array is required' }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }
    
    // Get X API Bearer Token from environment
    const bearerToken = Deno.env.get("X_API_BEARER_TOKEN");
    
    if (!bearerToken) {
      console.error("X_API_BEARER_TOKEN not configured");
      // Return mock data if no bearer token
      const mockTweets = userIds.map(userId => ({
        userId,
        tweets: generateMockTweets(userId, limit)
      }));
      
      return new Response(
        JSON.stringify({ tweets: mockTweets }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }
    
    // Get unique user IDs to avoid duplicate requests
    const uniqueUserIds = [...new Set(userIds)];
    
    // Fetch tweets for each unique user
    const allTweets = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          // Build Twitter API URL for user tweets
          const twitterUrl = new URL(`https://api.twitter.com/2/users/${userId}/tweets`);
          twitterUrl.searchParams.append('max_results', Math.max(10, Math.min(limit, 100)).toString());
          twitterUrl.searchParams.append('tweet.fields', 'created_at,author_id,public_metrics');
          twitterUrl.searchParams.append('expansions', 'author_id');
          twitterUrl.searchParams.append('user.fields', 'name,username,profile_image_url');
          twitterUrl.searchParams.append('exclude', 'retweets,replies');
          
          console.log(`Fetching tweets for user ID: ${userId}`);
          
          const twitterResponse = await fetch(twitterUrl.toString(), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
            }
          });
          
          if (!twitterResponse.ok) {
            const errorText = await twitterResponse.text();
            console.error(`Twitter API Error for user ${userId}:`, twitterResponse.status, errorText);
            
            // Return mock data for this user
            return {
              userId,
              tweets: generateMockTweets(userId, limit)
            };
          }
          
          const twitterData: TwitterAPIResponse = await twitterResponse.json();
          
          // Format the Twitter API response
          const tweets = formatTwitterResponse(twitterData, userId);
          
          // Limit to requested amount
          const limitedTweets = tweets.slice(0, limit);
          
          return {
            userId,
            username: twitterData.includes?.users?.[0]?.username || 'unknown',
            name: twitterData.includes?.users?.[0]?.name || 'Unknown User',
            profile_image_url: twitterData.includes?.users?.[0]?.profile_image_url,
            tweets: limitedTweets
          };
        } catch (error) {
          console.error(`Error fetching tweets for user ${userId}:`, error);
          return {
            userId,
            tweets: generateMockTweets(userId, limit)
          };
        }
      })
    );
    
    // Return all tweets with CORS headers
    return new Response(
      JSON.stringify({ tweets: allTweets }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in get-tweets function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
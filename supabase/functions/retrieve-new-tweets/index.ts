import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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

    const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');
    if (!bearerToken) {
      throw new Error('Twitter bearer token not configured');
    }

    const { usernames } = await req.json();
    
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
    
    // Fetch user IDs for the usernames
    const userIds = await Promise.all(
      cleanUsernames.map(async (username) => {
        try {
          const userResponse = await fetch(
            `https://api.twitter.com/2/users/by/username/${username}?user.fields=id,name,username,verified,profile_image_url`,
            {
              headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!userResponse.ok) {
            console.error(`Failed to fetch user ${username}: ${userResponse.status}`);
            return null;
          }

          const userData = await userResponse.json();
          return userData.data;
        } catch (error) {
          console.error(`Error fetching user ${username}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and create user map
    const validUsers = userIds.filter(user => user !== null) as TwitterUser[];
    const userMap = new Map(validUsers.map(user => [user.id, user]));

    if (validUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid Twitter users found',
          tweets: [] 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch tweets for all users (5 tweets per user)
    const allTweets: Tweet[] = [];
    
    for (const user of validUsers) {
      try {
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${user.id}/tweets?max_results=5&tweet.fields=created_at,author_id,public_metrics&expansions=author_id`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!tweetsResponse.ok) {
          console.error(`Failed to fetch tweets for ${user.username}: ${tweetsResponse.status}`);
          continue;
        }

        const tweetsData = await tweetsResponse.json();
        
        if (tweetsData.data && Array.isArray(tweetsData.data)) {
          // Add author information to each tweet
          const tweetsWithAuthor = tweetsData.data.map((tweet: any) => ({
            ...tweet,
            author: userMap.get(tweet.author_id) || user
          }));
          
          allTweets.push(...tweetsWithAuthor);
        }
      } catch (error) {
        console.error(`Error fetching tweets for ${user.username}:`, error);
      }
    }

    // Sort tweets by creation date (newest first)
    allTweets.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Format the response
    const formattedTweets = allTweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      author: {
        id: tweet.author.id,
        username: tweet.author.username,
        name: tweet.author.name,
        verified: tweet.author.verified,
        profile_image_url: tweet.author.profile_image_url
      },
      metrics: {
        likes: tweet.public_metrics.like_count,
        retweets: tweet.public_metrics.retweet_count,
        replies: tweet.public_metrics.reply_count,
        quotes: tweet.public_metrics.quote_count
      }
    }));

    return new Response(
      JSON.stringify({ 
        success: true,
        tweets: formattedTweets,
        count: formattedTweets.length
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
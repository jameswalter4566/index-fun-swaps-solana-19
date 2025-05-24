import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

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

interface TwitterAPIResponse {
  data?: Array<{
    id: string;
    text: string;
    author_id: string;
    created_at: string;
  }>;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
      profile_image_url?: string;
    }>;
  };
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  try {
    // Get the request body
    const { usernames, limit = 5 } = await req.json();
    
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Twitter usernames array is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    // Get X API Bearer Token from environment
    const bearerToken = Deno.env.get("X_API_BEARER_TOKEN");
    
    if (!bearerToken) {
      console.error("X_API_BEARER_TOKEN not configured");
      // Return mock data if no bearer token
      const mockMentions = usernames.map(username => ({
        username,
        mentions: generateMockMentions(username, limit)
      }));
      
      return new Response(
        JSON.stringify({ mentions: mockMentions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch mentions for each username
    const allMentions = await Promise.all(
      usernames.map(async (username) => {
        try {
          const cleanUsername = username.replace('@', '');
          
          // Build Twitter API URL for searching recent tweets
          const twitterUrl = new URL('https://api.twitter.com/2/tweets/search/recent');
          twitterUrl.searchParams.append('query', `@${cleanUsername} -is:retweet`);
          twitterUrl.searchParams.append('max_results', limit.toString());
          twitterUrl.searchParams.append('tweet.fields', 'created_at,author_id');
          twitterUrl.searchParams.append('expansions', 'author_id');
          twitterUrl.searchParams.append('user.fields', 'name,username,profile_image_url');
          
          console.log(`Fetching mentions for @${cleanUsername}`);
          
          const twitterResponse = await fetch(twitterUrl.toString(), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
            }
          });
          
          if (!twitterResponse.ok) {
            const errorText = await twitterResponse.text();
            console.error(`Twitter API Error for @${cleanUsername}:`, twitterResponse.status, errorText);
            
            // Return mock data for this user
            return {
              username: cleanUsername,
              mentions: generateMockMentions(cleanUsername, limit)
            };
          }
          
          const twitterData: TwitterAPIResponse = await twitterResponse.json();
          
          // Format the Twitter API response
          const mentions = formatTwitterResponse(twitterData, cleanUsername);
          
          return {
            username: cleanUsername,
            mentions: mentions
          };
        } catch (error) {
          console.error(`Error fetching mentions for ${username}:`, error);
          return {
            username: username.replace('@', ''),
            mentions: generateMockMentions(username.replace('@', ''), limit)
          };
        }
      })
    );
    
    // Return all mentions with CORS headers
    return new Response(
      JSON.stringify({ mentions: allMentions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-twitter-mentions function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});

// Format Twitter API response to match our expected data structure
function formatTwitterResponse(twitterData: TwitterAPIResponse, userId: string): TwitterMention[] {
  if (!twitterData.data || twitterData.data.length === 0) {
    return [];
  }
  
  return twitterData.data.map(tweet => {
    const author = twitterData.includes?.users?.find(user => user.id === tweet.author_id) || {
      id: tweet.author_id,
      username: 'unknown',
      name: 'Unknown User',
      profile_image_url: undefined
    };
    
    return {
      id: tweet.id,
      text: tweet.text,
      author: {
        id: author.id,
        username: author.username,
        name: author.name,
        profile_image_url: author.profile_image_url
      },
      createdAt: tweet.created_at
    };
  });
}

// Generate mock data as fallback when the Twitter API fails
function generateMockMentions(userId: string, count: number = 5): TwitterMention[] {
  const users = [
    { id: '1', username: 'tech_enthusiast', name: 'Tech Enthusiast' },
    { id: '2', username: 'social_butterfly', name: 'Social Butterfly' },
    { id: '3', username: 'news_reporter', name: 'News Reporter' },
    { id: '4', username: 'marketing_guru', name: 'Marketing Guru' },
    { id: '5', username: 'crypto_trader', name: 'Crypto Trader' }
  ];
  
  const mentionTexts = [
    `Hey @${userId}, what do you think about the latest market trends?`,
    `@${userId} Great insights on that new token! Would love your thoughts on $PEPE.`,
    `Did anyone see what @${userId} shared about the upcoming airdrop? 🚀`,
    `@${userId} Can you share more details about your trading strategy?`,
    `Looking forward to @${userId}'s analysis on the recent pump!`,
    `@${userId} called it again! This is why I follow their signals.`,
    `Thanks @${userId} for the alpha! Made some great gains today.`
  ];
  
  const mentions: TwitterMention[] = [];
  for (let i = 0; i < count; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomText = mentionTexts[Math.floor(Math.random() * mentionTexts.length)];
    
    // Create random date within the last 7 days
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 168)); // Last 7 days in hours
    
    mentions.push({
      id: `mock-${Date.now()}-${i}`,
      text: randomText,
      author: {
        id: randomUser.id,
        username: randomUser.username,
        name: randomUser.name,
        profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomUser.username}`
      },
      createdAt: date.toISOString()
    });
  }
  
  // Sort by date descending (newest first)
  return mentions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  description: string;
  verified: boolean;
  verified_type?: string;
  location?: string;
  created_at: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
}

interface TwitterAPIResponse {
  data?: TwitterUser | TwitterUser[];
  errors?: Array<{
    detail: string;
    title: string;
    type: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { usernames } = await req.json();
    
    if (!usernames || !Array.isArray(usernames)) {
      throw new Error("Invalid request: usernames array is required");
    }

    // Get X API Bearer Token from environment
    const bearerToken = Deno.env.get("X_API_BEARER_TOKEN");
    
    if (!bearerToken) {
      console.error("X_API_BEARER_TOKEN not configured");
      // Return mock data if no bearer token
      const mockUsers: TwitterUser[] = usernames.map((username: string, index: number) => ({
        id: `${1234567890 + index}`,
        name: username.replace('@', '').charAt(0).toUpperCase() + username.replace('@', '').slice(1),
        username: username.replace('@', ''),
        profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        description: `Trading signal provider and crypto analyst. Following market trends and opportunities.`,
        verified: index === 0,
        created_at: new Date().toISOString(),
        public_metrics: {
          followers_count: Math.floor(Math.random() * 100000) + 10000,
          following_count: Math.floor(Math.random() * 1000) + 100,
          tweet_count: Math.floor(Math.random() * 10000) + 1000,
          listed_count: Math.floor(Math.random() * 100) + 10,
        },
      }));
      
      return new Response(
        JSON.stringify({ users: mockUsers }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Clean usernames (remove @ if present)
    const cleanUsernames = usernames.map((u: string) => u.replace('@', ''));
    
    // Prepare user fields we want to fetch
    const userFields = [
      "id",
      "name", 
      "username",
      "created_at",
      "description",
      "location",
      "profile_image_url",
      "public_metrics",
      "verified",
      "verified_type"
    ].join(",");

    // Batch lookup - up to 100 usernames per request
    const url = `https://api.twitter.com/2/users/by?usernames=${cleanUsernames.join(',')}&user.fields=${userFields}`;
    
    console.log("Fetching from X API:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("X API Error:", response.status, errorText);
      
      // Handle rate limiting
      if (response.status === 429) {
        const resetTime = response.headers.get("x-rate-limit-reset");
        throw new Error(`Rate limit exceeded. Reset at: ${resetTime ? new Date(parseInt(resetTime) * 1000).toISOString() : 'unknown'}`);
      }
      
      throw new Error(`X API returned ${response.status}: ${errorText}`);
    }

    const data: TwitterAPIResponse = await response.json();
    
    if (data.errors) {
      console.error("X API Errors:", data.errors);
      throw new Error(`X API errors: ${data.errors.map(e => e.detail).join(", ")}`);
    }

    // Format response
    const users = Array.isArray(data.data) ? data.data : [data.data];
    
    // Transform to ensure all required fields
    const formattedUsers = users.filter(Boolean).map((user: TwitterUser) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      profile_image_url: user.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      description: user.description || '',
      verified: user.verified || false,
      verified_type: user.verified_type,
      location: user.location,
      created_at: user.created_at,
      followers_count: user.public_metrics?.followers_count || 0,
      following_count: user.public_metrics?.following_count || 0,
      tweet_count: user.public_metrics?.tweet_count || 0,
      listed_count: user.public_metrics?.listed_count || 0,
    }));

    return new Response(
      JSON.stringify({ users: formattedUsers }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-twitter-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
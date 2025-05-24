import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
  description: string;
  verified: boolean;
  followers_count: number;
  following_count: number;
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

    // For development, return mock data
    // In production, you would use the Twitter API v2
    // const bearerToken = Deno.env.get("TWITTER_BEARER_TOKEN");
    
    const mockUsers: TwitterUser[] = usernames.map((username: string, index: number) => ({
      id: `${1234567890 + index}`,
      name: username.replace('@', '').charAt(0).toUpperCase() + username.replace('@', '').slice(1),
      username: username.replace('@', ''),
      profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      description: `Trading signal provider and crypto analyst. Following market trends and opportunities.`,
      verified: index === 0, // First user is verified
      followers_count: Math.floor(Math.random() * 100000) + 10000,
      following_count: Math.floor(Math.random() * 1000) + 100,
    }));

    // In production, you would fetch from Twitter API:
    /*
    const response = await fetch(
      `https://api.twitter.com/2/users/by?usernames=${usernames.join(',')}&user.fields=profile_image_url,description,verified,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );
    
    const data = await response.json();
    const users = data.data.map((user: any) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      profile_image_url: user.profile_image_url,
      description: user.description,
      verified: user.verified,
      followers_count: user.public_metrics.followers_count,
      following_count: user.public_metrics.following_count,
    }));
    */

    return new Response(
      JSON.stringify({ users: mockUsers }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
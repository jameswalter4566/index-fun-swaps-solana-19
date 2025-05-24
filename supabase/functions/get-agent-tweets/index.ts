import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { agentId, limit = 50 } = await req.json();
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get tweets associated with this agent
    const { data: tweets, error } = await supabase
      .from('kol_tweets')
      .select('*')
      .contains('agent_ids', [agentId])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Format tweets for the frontend
    const formattedTweets = tweets?.map(tweet => ({
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
    })) || [];

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
    console.error('Error in get-agent-tweets function:', error);
    
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
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoinFilterParameters {
  minMarketCap?: number;
  maxMarketCap?: number;
  minLiquidity?: number;
  maxLiquidity?: number;
  minHolders?: number;
  maxHolders?: number;
  minVolume24h?: number;
  maxVolume24h?: number;
  minPriceChangePercentage?: number;
  maxPriceChangePercentage?: number;
  excludeRugPulls?: boolean;
  onlyVerified?: boolean;
  maxAge?: number; // in hours
  minBuys?: number;
  minSells?: number;
  maxSells?: number;
  burnPercentage?: number;
  freezeAuthority?: boolean;
  mintAuthority?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { method } = req;
    const { agentId, filters, userId } = await req.json();

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (method === 'GET') {
      // Get current filters for an agent
      const { data, error } = await supabase
        .from('coin_filter_parameters')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return new Response(
        JSON.stringify({ data: data || null }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (method === 'POST' || method === 'PUT') {
      // Validate filters
      const validatedFilters: CoinFilterParameters = {};
      
      if (filters.minMarketCap !== undefined) validatedFilters.minMarketCap = Number(filters.minMarketCap);
      if (filters.maxMarketCap !== undefined) validatedFilters.maxMarketCap = Number(filters.maxMarketCap);
      if (filters.minLiquidity !== undefined) validatedFilters.minLiquidity = Number(filters.minLiquidity);
      if (filters.maxLiquidity !== undefined) validatedFilters.maxLiquidity = Number(filters.maxLiquidity);
      if (filters.minHolders !== undefined) validatedFilters.minHolders = Number(filters.minHolders);
      if (filters.maxHolders !== undefined) validatedFilters.maxHolders = Number(filters.maxHolders);
      if (filters.minVolume24h !== undefined) validatedFilters.minVolume24h = Number(filters.minVolume24h);
      if (filters.maxVolume24h !== undefined) validatedFilters.maxVolume24h = Number(filters.maxVolume24h);
      if (filters.minPriceChangePercentage !== undefined) validatedFilters.minPriceChangePercentage = Number(filters.minPriceChangePercentage);
      if (filters.maxPriceChangePercentage !== undefined) validatedFilters.maxPriceChangePercentage = Number(filters.maxPriceChangePercentage);
      if (filters.excludeRugPulls !== undefined) validatedFilters.excludeRugPulls = Boolean(filters.excludeRugPulls);
      if (filters.onlyVerified !== undefined) validatedFilters.onlyVerified = Boolean(filters.onlyVerified);
      if (filters.maxAge !== undefined) validatedFilters.maxAge = Number(filters.maxAge);
      if (filters.minBuys !== undefined) validatedFilters.minBuys = Number(filters.minBuys);
      if (filters.minSells !== undefined) validatedFilters.minSells = Number(filters.minSells);
      if (filters.maxSells !== undefined) validatedFilters.maxSells = Number(filters.maxSells);
      if (filters.burnPercentage !== undefined) validatedFilters.burnPercentage = Number(filters.burnPercentage);
      if (filters.freezeAuthority !== undefined) validatedFilters.freezeAuthority = Boolean(filters.freezeAuthority);
      if (filters.mintAuthority !== undefined) validatedFilters.mintAuthority = Boolean(filters.mintAuthority);

      // Check if filters already exist for this agent
      const { data: existingData } = await supabase
        .from('coin_filter_parameters')
        .select('id')
        .eq('agent_id', agentId)
        .single();

      let result;
      if (existingData) {
        // Update existing filters
        result = await supabase
          .from('coin_filter_parameters')
          .update({ 
            filters: validatedFilters,
            user_id: userId || null
          })
          .eq('agent_id', agentId)
          .select()
          .single();
      } else {
        // Insert new filters
        result = await supabase
          .from('coin_filter_parameters')
          .insert({ 
            agent_id: agentId,
            filters: validatedFilters,
            user_id: userId || null
          })
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result.data,
          message: 'Filters saved successfully' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in coin-parameters function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SolanaTokenData {
  token: {
    name: string;
    symbol: string;
    mint: string;
    uri: string;
    decimals: number;
    hasFileMetaData: boolean;
    createdOn: string;
    description?: string;
    image?: string;
    showName: boolean;
    twitter?: string;
    telegram?: string;
    strictSocials?: {
      twitter?: string;
      telegram?: string;
    };
  };
  pools: Array<{
    poolId: string;
    liquidity: {
      quote: number;
      usd: number;
    };
    price: {
      quote: number;
      usd: number;
    };
    tokenSupply: number;
    lpBurn: number;
    tokenAddress: string;
    marketCap: {
      quote: number;
      usd: number;
    };
    decimals: number;
    security: {
      freezeAuthority: string | null;
      mintAuthority: string | null;
    };
    quoteToken: string;
    market: string;
    curvePercentage: number;
    curve: string;
    deployer: string;
    lastUpdated: number;
    createdAt: number;
    txns: {
      buys: number;
      total: number;
      volume: number;
      sells: number;
    };
  }>;
  events: {
    [key: string]: {
      priceChangePercentage: number;
    };
  };
  risk?: any;
  buys: number;
  sells: number;
  txns: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const solanaApiKey = Deno.env.get('SOLANA_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { limit = 10, bypassFilters = false } = body;

    // Try to fetch from Solana Tracker API with correct base URL
    const response = await fetch('https://data.solanatracker.io/tokens/latest', {
      headers: {
        'x-api-key': solanaApiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Solana Tracker API error:', response.status, response.statusText);
      throw new Error(`Solana Tracker API error: ${response.status}`);
    }

    const tokens: SolanaTokenData[] = await response.json();

    // If bypassFilters is true, return top tokens without filtering
    if (bypassFilters) {
      const topTokens = tokens
        .filter(tokenData => tokenData.pools && tokenData.pools.length > 0)
        .slice(0, limit)
        .map(tokenData => {
          const pool = tokenData.pools[0];
          const priceChange24h = tokenData.events?.['24h']?.priceChangePercentage || 0;
          
          // Calculate confidence based on basic metrics
          let confidence: 'high' | 'medium' | 'low' = 'medium';
          if (pool.liquidity?.usd > 100000 && pool.lpBurn >= 100) {
            confidence = 'high';
          } else if (pool.liquidity?.usd < 10000) {
            confidence = 'low';
          }

          // Generate reason based on token characteristics
          const reasons = [];
          if (pool.liquidity?.usd > 100000) reasons.push('High liquidity');
          if (pool.lpBurn >= 100) reasons.push('100% LP burned');
          if (priceChange24h > 10) reasons.push(`Up ${priceChange24h.toFixed(1)}% in 24h`);
          if (tokenData.token.twitter || tokenData.token.telegram) reasons.push('Active socials');
          if (reasons.length === 0) reasons.push('New trending token');

          return {
            symbol: tokenData.token.symbol,
            name: tokenData.token.name,
            price: pool.price?.usd || 0,
            marketCap: pool.marketCap?.usd || 0,
            confidence,
            reason: reasons.join(', '),
            logo: tokenData.token.image,
            priceChange24h,
          };
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          recommendations: topTokens
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get all agent filters
    const { data: filterData, error: filterError } = await supabase
      .from('coin_filter_parameters')
      .select('*');

    if (filterError) {
      throw filterError;
    }

    const recommendations = [];

    // Process each agent's filters
    for (const filterSet of filterData || []) {
      const filters = filterSet.filters as any;
      const agentId = filterSet.agent_id;

      // Filter tokens based on agent's criteria
      for (const tokenData of tokens) {
        if (!tokenData.pools || tokenData.pools.length === 0) continue;

        const pool = tokenData.pools[0]; // Use first pool for now
        const marketCapUsd = pool.marketCap?.usd || 0;
        const liquidityUsd = pool.liquidity?.usd || 0;
        const volume24h = pool.txns?.volume || 0;
        const priceChange1h = tokenData.events?.['1h']?.priceChangePercentage || 0;
        const ageInHours = (Date.now() - pool.createdAt) / (1000 * 60 * 60);
        const buys = tokenData.buys || 0;
        const sells = tokenData.sells || 0;
        const burnPercentage = pool.lpBurn || 0;
        const hasFreezeAuthority = pool.security?.freezeAuthority !== null;
        const hasMintAuthority = pool.security?.mintAuthority !== null;

        // Apply filters
        let passesFilters = true;
        let failureReasons = [];

        if (filters.minMarketCap && marketCapUsd < filters.minMarketCap) {
          passesFilters = false;
          failureReasons.push(`Market cap too low: $${marketCapUsd.toFixed(2)}`);
        }
        if (filters.maxMarketCap && marketCapUsd > filters.maxMarketCap) {
          passesFilters = false;
          failureReasons.push(`Market cap too high: $${marketCapUsd.toFixed(2)}`);
        }
        if (filters.minLiquidity && liquidityUsd < filters.minLiquidity) {
          passesFilters = false;
          failureReasons.push(`Liquidity too low: $${liquidityUsd.toFixed(2)}`);
        }
        if (filters.maxLiquidity && liquidityUsd > filters.maxLiquidity) {
          passesFilters = false;
          failureReasons.push(`Liquidity too high: $${liquidityUsd.toFixed(2)}`);
        }
        if (filters.minVolume24h && volume24h < filters.minVolume24h) {
          passesFilters = false;
          failureReasons.push(`24h volume too low: $${volume24h.toFixed(2)}`);
        }
        if (filters.maxVolume24h && volume24h > filters.maxVolume24h) {
          passesFilters = false;
          failureReasons.push(`24h volume too high: $${volume24h.toFixed(2)}`);
        }
        if (filters.minPriceChangePercentage && priceChange1h < filters.minPriceChangePercentage) {
          passesFilters = false;
          failureReasons.push(`Price change too low: ${priceChange1h.toFixed(2)}%`);
        }
        if (filters.maxPriceChangePercentage && priceChange1h > filters.maxPriceChangePercentage) {
          passesFilters = false;
          failureReasons.push(`Price change too high: ${priceChange1h.toFixed(2)}%`);
        }
        if (filters.maxAge && ageInHours > filters.maxAge) {
          passesFilters = false;
          failureReasons.push(`Token too old: ${ageInHours.toFixed(1)} hours`);
        }
        if (filters.minBuys && buys < filters.minBuys) {
          passesFilters = false;
          failureReasons.push(`Not enough buys: ${buys}`);
        }
        if (filters.minSells && sells < filters.minSells) {
          passesFilters = false;
          failureReasons.push(`Not enough sells: ${sells}`);
        }
        if (filters.maxSells && sells > filters.maxSells) {
          passesFilters = false;
          failureReasons.push(`Too many sells: ${sells}`);
        }
        if (filters.burnPercentage && burnPercentage < filters.burnPercentage) {
          passesFilters = false;
          failureReasons.push(`LP burn too low: ${burnPercentage}%`);
        }
        if (filters.freezeAuthority === false && hasFreezeAuthority) {
          passesFilters = false;
          failureReasons.push('Has freeze authority');
        }
        if (filters.mintAuthority === false && hasMintAuthority) {
          passesFilters = false;
          failureReasons.push('Has mint authority');
        }

        if (passesFilters) {
          // Calculate confidence score based on multiple factors
          let confidenceScore = 0.5; // Base score

          // Adjust based on liquidity
          if (liquidityUsd > 50000) confidenceScore += 0.1;
          if (liquidityUsd > 100000) confidenceScore += 0.1;

          // Adjust based on volume
          if (volume24h > 10000) confidenceScore += 0.1;
          if (volume24h > 50000) confidenceScore += 0.1;

          // Adjust based on burn percentage
          if (burnPercentage >= 100) confidenceScore += 0.1;

          // Adjust based on security
          if (!hasFreezeAuthority && !hasMintAuthority) confidenceScore += 0.1;

          // Cap at 1.0
          confidenceScore = Math.min(confidenceScore, 1.0);

          // Generate recommendation reason
          const reasons = [];
          if (priceChange1h > 0) reasons.push(`Price up ${priceChange1h.toFixed(2)}% in 1h`);
          if (volume24h > 50000) reasons.push(`High volume: $${volume24h.toFixed(0)}`);
          if (burnPercentage >= 100) reasons.push('100% LP burned');
          if (!hasFreezeAuthority && !hasMintAuthority) reasons.push('No mint/freeze authority');
          if (tokenData.token.twitter) reasons.push('Has Twitter presence');

          const recommendation = {
            agent_id: agentId,
            token_address: tokenData.token.mint,
            token_data: tokenData,
            recommendation_reason: reasons.join(', '),
            confidence_score: confidenceScore
          };

          // Check if we already have this recommendation
          const { data: existing } = await supabase
            .from('coin_recommendations')
            .select('id')
            .eq('agent_id', agentId)
            .eq('token_address', tokenData.token.mint)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (!existing) {
            recommendations.push(recommendation);
          }
        }
      }
    }

    // Insert new recommendations
    if (recommendations.length > 0) {
      const { error: insertError } = await supabase
        .from('coin_recommendations')
        .insert(recommendations);

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${tokens.length} tokens, created ${recommendations.length} recommendations`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in coin-recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
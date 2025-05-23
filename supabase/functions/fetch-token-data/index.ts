import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tokenAddresses } = await req.json()
    
    if (!tokenAddresses || !Array.isArray(tokenAddresses) || tokenAddresses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Token addresses are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const solanaApiKey = Deno.env.get('solana_key')
    if (!solanaApiKey) {
      return new Response(
        JSON.stringify({ error: 'Solana API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const tokenData = await Promise.all(
      tokenAddresses.map(async (address: string) => {
        try {
          const response = await fetch(
            `https://data.solanatracker.io/tokens/${address}`,
            {
              headers: {
                'x-api-key': solanaApiKey,
              },
            }
          )

          if (!response.ok) {
            console.error(`Failed to fetch token ${address}: ${response.status}`)
            return null
          }

          const data = await response.json()
          
          // Extract relevant data
          const pool = data.pools?.[0] // Get the first pool
          return {
            address,
            name: data.token?.name || 'Unknown',
            symbol: data.token?.symbol || 'N/A',
            image: data.token?.image || '',
            decimals: data.token?.decimals || 6,
            marketCap: pool?.marketCap?.usd || 0,
            price: pool?.price?.usd || 0,
            liquidity: pool?.liquidity?.usd || 0,
            holders: data.holders || 0,
            priceChange24h: data.events?.['24h']?.priceChangePercentage || 0,
          }
        } catch (error) {
          console.error(`Error fetching token ${address}:`, error)
          return null
        }
      })
    )

    // Filter out failed requests
    const validTokens = tokenData.filter(token => token !== null)

    // Calculate combined metrics
    const totalMarketCap = validTokens.reduce((sum, token) => sum + token.marketCap, 0)
    const averageMarketCap = validTokens.length > 0 ? totalMarketCap / validTokens.length : 0

    return new Response(
      JSON.stringify({
        tokens: validTokens,
        metrics: {
          totalMarketCap,
          averageMarketCap,
          tokenCount: validTokens.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
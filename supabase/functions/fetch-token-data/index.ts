import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
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

    console.log(`Fetching data for ${tokenAddresses.length} tokens:`, tokenAddresses)
    
    // Fetch tokens sequentially to avoid overwhelming the API
    const tokenData = []
    
    for (let i = 0; i < tokenAddresses.length; i++) {
      const address = tokenAddresses[i]
      console.log(`[${i + 1}/${tokenAddresses.length}] Fetching token: ${address}`)
      
      let retryCount = 0
      const maxRetries = 2
      let success = false
      
      while (retryCount <= maxRetries && !success) {
        try {
          if (retryCount > 0) {
            console.log(`Retry ${retryCount}/${maxRetries} for token ${address}`)
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)) // Exponential backoff
          }
          
          const response = await fetch(
            `https://data.solanatracker.io/tokens/${address}`,
            {
              headers: {
                'x-api-key': solanaApiKey,
              },
            }
          )

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Failed to fetch token ${address}: Status ${response.status}, Error: ${errorText}`)
            
            if (response.status === 429 && retryCount < maxRetries) {
              retryCount++
              continue
            }
            
            // Add placeholder token with error info
            tokenData.push({
              address,
              name: 'Unknown Token',
              symbol: address.slice(0, 8),
              image: '',
              decimals: 6,
              marketCap: 0,
              price: 0,
              liquidity: 0,
              holders: 0,
              priceChange24h: 0,
              error: `Failed to fetch: ${response.status}`,
            })
            break
          }

          const data = await response.json()
          console.log(`Successfully fetched token ${address}:`, data.token?.name || 'Unknown')
          
          // Extract relevant data
          const pool = data.pools?.[0] // Get the first pool
          tokenData.push({
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
          })
          
          success = true // Mark as successful
          
          // Add a longer delay between requests to avoid rate limiting
          if (i < tokenAddresses.length - 1) {
            console.log(`Waiting 1 second before next request to avoid rate limiting...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
        } catch (error) {
          console.error(`Error fetching token ${address}:`, error)
          
          if (retryCount < maxRetries) {
            retryCount++
            continue
          }
          
          // Add placeholder token for failed requests
          tokenData.push({
            address,
            name: 'Unknown Token',
            symbol: address.slice(0, 8),
            image: '',
            decimals: 6,
            marketCap: 0,
            price: 0,
            liquidity: 0,
            holders: 0,
            priceChange24h: 0,
            error: `Error: ${error.message}`,
          })
          break
        }
      }
    }

    // All tokens are already included (even failed ones show as placeholders)
    console.log(`Successfully processed ${tokenData.length} out of ${tokenAddresses.length} tokens`)
    
    // Count successful vs failed tokens
    const successfulTokens = tokenData.filter(token => !token.error)
    const failedTokens = tokenData.filter(token => token.error)
    console.log(`Successful: ${successfulTokens.length}, Failed: ${failedTokens.length}`)

    // Calculate combined metrics
    const totalMarketCap = tokenData.reduce((sum, token) => sum + token.marketCap, 0)
    // Average should be total divided by ALL tokens (not just successful ones)
    const averageMarketCap = tokenData.length > 0 ? totalMarketCap / tokenData.length : 0

    return new Response(
      JSON.stringify({
        tokens: tokenData, // Return all tokens (including failed ones as placeholders)
        metrics: {
          totalMarketCap,
          averageMarketCap,
          tokenCount: tokenData.length,
          successfulCount: successfulTokens.length,
          failedCount: failedTokens.length,
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
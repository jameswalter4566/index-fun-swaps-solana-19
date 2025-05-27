import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tokenAddress } = await req.json()
    
    if (!tokenAddress) {
      return new Response(
        JSON.stringify({ error: 'Token address is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get Solana Tracker API key from environment
    const SOLANA_KEY = Deno.env.get('SOLANA_KEY')
    if (!SOLANA_KEY) {
      console.error('SOLANA_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Fetch token data from Solana Tracker API
    const apiUrl = `https://data.solanatracker.io/tokens/${tokenAddress}`
    console.log('Fetching token data from:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': SOLANA_KEY,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Solana Tracker API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch token data: ${response.status}`,
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform the data to a consistent format
    const tokenData = {
      token: data.token,
      pools: data.pools,
      events: data.events,
      risk: data.risk,
      // Add calculated fields for UI display
      formattedPrice: data.pools?.[0]?.price?.usd || 0,
      formattedMarketCap: data.pools?.[0]?.marketCap?.usd || 0,
      formattedLiquidity: data.pools?.[0]?.liquidity?.usd || 0,
      priceChange24h: data.events?.['24h']?.priceChangePercentage || 0
    }

    return new Response(
      JSON.stringify(tokenData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in query-new-coin function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
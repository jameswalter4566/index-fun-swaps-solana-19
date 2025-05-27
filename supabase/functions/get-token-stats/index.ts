// Define CORS headers inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Fetch token stats from Solana Tracker API
    const apiUrl = `https://data.solanatracker.io/stats/${tokenAddress}`
    console.log('Fetching token stats from:', apiUrl)

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
          error: `Failed to fetch token stats: ${response.status}`,
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const stats = await response.json()
    
    // Transform and enhance the data
    const enhancedStats = {
      '1m': stats['1m'] || {},
      '5m': stats['5m'] || {},
      '15m': stats['15m'] || {},
      '30m': stats['30m'] || {},
      '1h': stats['1h'] || {},
      '4h': stats['4h'] || {},
      '24h': stats['24h'] || {},
      summary: {
        totalBuyers24h: stats['24h']?.buyers || 0,
        totalSellers24h: stats['24h']?.sellers || 0,
        volume24h: stats['24h']?.volume?.total || 0,
        transactions24h: stats['24h']?.transactions || 0,
        uniqueWallets24h: stats['24h']?.wallets || 0,
        priceChange24h: stats['24h']?.priceChangePercentage || 0,
        buyPressure: stats['24h']?.buys && stats['24h']?.sells 
          ? ((stats['24h'].buys / (stats['24h'].buys + stats['24h'].sells)) * 100).toFixed(2) 
          : '50.00'
      }
    }

    return new Response(
      JSON.stringify({
        stats: enhancedStats,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in get-token-stats function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
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

    // Fetch top traders from Solana Tracker API
    const apiUrl = `https://data.solanatracker.io/top-traders/${tokenAddress}`
    console.log('Fetching top traders from:', apiUrl)

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
          error: `Failed to fetch top traders: ${response.status}`,
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const traders = await response.json()
    
    // Transform and enhance the data
    const enhancedTraders = traders.slice(0, 50).map((trader: any, index: number) => ({
      rank: index + 1,
      wallet: trader.wallet,
      held: trader.held,
      sold: trader.sold,
      holding: trader.holding,
      realizedPnL: trader.realized,
      unrealizedPnL: trader.unrealized,
      totalPnL: trader.total,
      totalInvested: trader.total_invested,
      roi: trader.total_invested > 0 ? ((trader.total / trader.total_invested - 1) * 100).toFixed(2) : '0',
      status: trader.holding > 0 ? 'holding' : 'exited'
    }))

    return new Response(
      JSON.stringify({
        traders: enhancedTraders,
        count: enhancedTraders.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in get-top-traders function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
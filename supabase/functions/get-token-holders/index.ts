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

    // Fetch token holders from Solana Tracker API
    const apiUrl = `https://data.solanatracker.io/tokens/${tokenAddress}/holders`
    console.log('Fetching token holders from:', apiUrl)

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
          error: `Failed to fetch token holders: ${response.status}`,
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform and enhance the data
    const enhancedHolders = {
      totalHolders: data.total || 0,
      topHolders: data.accounts?.slice(0, 50).map((holder: any, index: number) => ({
        rank: index + 1,
        wallet: holder.wallet,
        amount: holder.amount,
        valueUSD: holder.value?.usd || 0,
        percentage: holder.percentage || 0,
        isWhale: holder.percentage > 1, // Consider holders with >1% as whales
        isTop10: index < 10
      })) || [],
      distribution: {
        top10Percentage: data.accounts?.slice(0, 10).reduce((sum: number, h: any) => sum + (h.percentage || 0), 0) || 0,
        top20Percentage: data.accounts?.slice(0, 20).reduce((sum: number, h: any) => sum + (h.percentage || 0), 0) || 0,
        top50Percentage: data.accounts?.slice(0, 50).reduce((sum: number, h: any) => sum + (h.percentage || 0), 0) || 0,
      }
    }

    return new Response(
      JSON.stringify({
        holders: enhancedHolders,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in get-token-holders function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
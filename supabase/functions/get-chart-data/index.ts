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
    const { tokenAddress, type = '15m', timeFrom, timeTo, marketCap, removeOutliers = true } = await req.json()
    
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

    // Build query parameters
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (timeFrom) params.append('time_from', timeFrom)
    if (timeTo) params.append('time_to', timeTo)
    if (marketCap) params.append('marketCap', marketCap)
    if (removeOutliers !== undefined) params.append('removeOutliers', removeOutliers.toString())

    // Fetch chart data from Solana Tracker API
    const apiUrl = `https://data.solanatracker.io/chart/${tokenAddress}?${params.toString()}`
    console.log('Fetching chart data from:', apiUrl)

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
          error: `Failed to fetch chart data: ${response.status}`,
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform the data to include additional calculated fields
    const chartData = {
      oclhv: data.oclhv || [],
      // Calculate some statistics
      stats: {
        totalVolume: data.oclhv?.reduce((sum: number, candle: any) => sum + (candle.volume || 0), 0) || 0,
        priceRange: {
          min: Math.min(...(data.oclhv?.map((c: any) => c.low) || [0])),
          max: Math.max(...(data.oclhv?.map((c: any) => c.high) || [0]))
        },
        candleCount: data.oclhv?.length || 0,
        timeframe: type
      }
    }

    return new Response(
      JSON.stringify(chartData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in get-chart-data function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
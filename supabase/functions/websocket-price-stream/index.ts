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
    const { tokenAddress, interval = 2000 } = await req.json()
    
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

    // Create a readable stream for Server-Sent Events
    const body = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let lastPrice = 0

        // Function to fetch current price
        const fetchPrice = async () => {
          try {
            const apiUrl = `https://data.solanatracker.io/tokens/${tokenAddress}`
            const response = await fetch(apiUrl, {
              headers: {
                'x-api-key': SOLANA_KEY,
                'Accept': 'application/json'
              }
            })

            if (response.ok) {
              const data = await response.json()
              const currentPrice = data.pools?.[0]?.price?.usd || 0
              
              // Send price update
              const message = {
                type: 'price',
                data: {
                  token: tokenAddress,
                  price: currentPrice,
                  priceSOL: data.pools?.[0]?.price?.quote || 0,
                  marketCap: data.pools?.[0]?.marketCap?.usd || 0,
                  liquidity: data.pools?.[0]?.liquidity?.usd || 0,
                  volume24h: data.pools?.[0]?.txns?.volume || 0,
                  priceChange: lastPrice ? ((currentPrice - lastPrice) / lastPrice) * 100 : 0,
                  timestamp: Date.now()
                }
              }

              lastPrice = currentPrice

              // Send as Server-Sent Event
              const sseMessage = `data: ${JSON.stringify(message)}\n\n`
              controller.enqueue(encoder.encode(sseMessage))
            }
          } catch (error) {
            console.error('Error fetching price:', error)
            // Send error event
            const errorMessage = `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`
            controller.enqueue(encoder.encode(errorMessage))
          }
        }

        // Initial price fetch
        await fetchPrice()

        // Set up interval for price updates
        const intervalId = setInterval(fetchPrice, interval)

        // Clean up on close
        req.signal.addEventListener('abort', () => {
          clearInterval(intervalId)
          controller.close()
        })
      }
    })

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in websocket-price-stream function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
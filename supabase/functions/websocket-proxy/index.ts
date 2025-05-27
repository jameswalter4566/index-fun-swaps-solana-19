// WebSocket proxy for Solana Tracker real-time data
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
    // Upgrade to WebSocket if requested
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    // Get token address from URL params
    const url = new URL(req.url);
    const tokenAddress = url.searchParams.get('token');
    
    if (!tokenAddress) {
      return new Response(
        JSON.stringify({ error: 'Token address is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get Solana Tracker API key
    const SOLANA_KEY = Deno.env.get('SOLANA_KEY');
    if (!SOLANA_KEY) {
      console.error('SOLANA_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create WebSocket connection to client
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to Solana Tracker WebSocket
    // Note: You'll need the actual WebSocket URL from Solana Tracker
    const trackerWS = new WebSocket('wss://websocket.solanatracker.io', {
      headers: {
        'x-api-key': SOLANA_KEY
      }
    });

    // Set up Solana Tracker WebSocket handlers
    trackerWS.onopen = () => {
      console.log('Connected to Solana Tracker WebSocket');
      
      // Join the token room for price updates
      trackerWS.send(JSON.stringify({
        type: 'join',
        room: `token:${tokenAddress}`
      }));
    };

    trackerWS.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Forward token updates to client
        if (message.type === 'message' && message.room === `token:${tokenAddress}`) {
          const data = message.data;
          
          // Format data for client
          const clientMessage = {
            type: 'price',
            data: {
              token: tokenAddress,
              price: data.price?.usd || 0,
              priceSOL: data.price?.quote || 0,
              marketCap: data.marketCap?.usd || 0,
              liquidity: data.liquidity?.usd || 0,
              tokenSupply: data.tokenSupply,
              lpBurn: data.lpBurn,
              lastUpdated: data.lastUpdated,
              timestamp: Date.now()
            }
          };

          // Send to client if connection is open
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify(clientMessage));
          }
        }
      } catch (error) {
        console.error('Error processing tracker message:', error);
      }
    };

    trackerWS.onerror = (error) => {
      console.error('Solana Tracker WebSocket error:', error);
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({ type: 'error', message: 'Tracker connection error' }));
      }
    };

    trackerWS.onclose = () => {
      console.log('Solana Tracker WebSocket closed');
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close();
      }
    };

    // Set up client WebSocket handlers
    clientSocket.onopen = () => {
      console.log('Client connected');
    };

    clientSocket.onmessage = (event) => {
      // Handle any client messages if needed
      console.log('Client message:', event.data);
    };

    clientSocket.onclose = () => {
      console.log('Client disconnected');
      // Clean up tracker connection
      if (trackerWS.readyState === WebSocket.OPEN) {
        trackerWS.send(JSON.stringify({
          type: 'leave',
          room: `token:${tokenAddress}`
        }));
        trackerWS.close();
      }
    };

    clientSocket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
      trackerWS.close();
    };

    return response;

  } catch (error) {
    console.error('Error in websocket-proxy function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
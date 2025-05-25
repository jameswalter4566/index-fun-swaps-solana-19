import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { assistantId, assistantConfig } = await req.json();
    
    // Get Vapi API key from environment
    const vapiApiKey = Deno.env.get('VAPI_API_KEY');
    
    if (!vapiApiKey) {
      throw new Error('VAPI_API_KEY not configured');
    }

    // Prepare the request body for WebSocket transport
    const requestBody: any = {
      transport: {
        provider: "vapi.websocket",
        audioFormat: {
          format: "pcm_s16le",
          container: "raw",
          sampleRate: 16000 // 16kHz for optimal quality/bandwidth balance
        }
      }
    };

    // Use either assistantId or inline assistant config
    if (assistantId) {
      requestBody.assistant = { assistantId };
    } else if (assistantConfig) {
      requestBody.assistant = assistantConfig;
    } else {
      // Default inline assistant
      requestBody.assistant = {
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: "You are a helpful AI trading assistant. Be concise and professional."
          }],
          temperature: 0.7
        },
        voice: {
          provider: "openai",
          voiceId: "nova"
        },
        firstMessage: "Hello! I'm your trading assistant. How can I help you today?",
        firstMessageMode: "assistant-speaks-first"
      };
    }

    console.log('Creating WebSocket call:', requestBody);

    // Create the WebSocket call
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vapi API Error:', response.status, errorText);
      throw new Error(`Vapi API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('WebSocket call created:', data);

    return new Response(
      JSON.stringify({
        success: true,
        callId: data.id,
        websocketUrl: data.transport.websocketCallUrl,
        status: data.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating WebSocket call:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
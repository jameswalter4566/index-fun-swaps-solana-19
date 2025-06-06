import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const {
      from,
      to,
      amount = '1',
      slippage = 10,
      payer,
      priorityFee,
      priorityFeeLevel,
      txVersion,
      fee,
      feeType,
      onlyDirectRoutes = false
    } = body;

    // Validate required parameters
    if (!from || !to || !payer) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: from, to, and payer are required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const solanaApiKey = Deno.env.get('SOLANA_KEY');
    if (!solanaApiKey) {
      throw new Error('SOLANA_KEY environment variable is not set');
    }

    console.log('Requesting swap from Solana Tracker API...');
    
    // Build request body for Solana Tracker API
    const swapBody: any = {
      from,
      to,
      fromAmount: amount.toString(), // Use fromAmount per Solana Tracker API docs
      slippage: Number(slippage),
      payer
    };

    // Add optional parameters if provided
    // Skip priority fee parameters when set to 'auto' to avoid API errors
    if (priorityFee !== undefined && priorityFee !== 'auto') {
      swapBody.priorityFee = priorityFee;
    }
    // Only add priorityFeeLevel if priorityFee is explicitly set to a numeric value
    if (priorityFee !== undefined && priorityFee !== 'auto' && priorityFeeLevel) {
      swapBody.priorityFeeLevel = priorityFeeLevel;
    }
    if (txVersion) swapBody.txVersion = txVersion;
    if (fee) swapBody.fee = fee;
    if (feeType) swapBody.feeType = feeType;
    if (onlyDirectRoutes !== undefined) swapBody.onlyDirectRoutes = onlyDirectRoutes;

    // Make request to Solana Tracker Swap API
    const response = await fetch('https://swap-v2.solanatracker.io/swap', {
      method: 'POST',
      headers: {
        'x-api-key': solanaApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(swapBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Solana Tracker Swap API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Swap API error: ${response.status} - ${errorText}` 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const swapData = await response.json();

    // Log swap details for debugging
    console.log('Swap response:', {
      from,
      to,
      amount,
      amountOut: swapData.rate?.amountOut,
      priceImpact: swapData.rate?.priceImpact,
      type: swapData.type
    });

    // Return the swap transaction data
    return new Response(
      JSON.stringify({
        success: true,
        ...swapData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in post-swap function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
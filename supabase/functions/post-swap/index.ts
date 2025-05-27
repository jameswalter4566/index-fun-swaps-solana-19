import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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
    const swapBody = {
      from,
      to,
      amount: amount.toString(), // Ensure amount is a string
      slippage: Number(slippage),
      payer
    };

    // Add optional parameters if provided
    if (priorityFee !== undefined) swapBody.priorityFee = priorityFee;
    if (priorityFeeLevel) swapBody.priorityFeeLevel = priorityFeeLevel;
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
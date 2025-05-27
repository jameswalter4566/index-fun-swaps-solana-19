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
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const amount = url.searchParams.get('amount') || '1';
    const slippage = url.searchParams.get('slippage') || '10';
    const payer = url.searchParams.get('payer');
    const priorityFee = url.searchParams.get('priorityFee');
    const priorityFeeLevel = url.searchParams.get('priorityFeeLevel');
    const fee = url.searchParams.get('fee');
    const feeType = url.searchParams.get('feeType');

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

    // Build query parameters for Solana Tracker API
    const swapParams = new URLSearchParams({
      from,
      to,
      fromAmount: amount,  // Use fromAmount per Solana Tracker API docs
      slippage,
      payer
    });

    // Add optional parameters if provided
    // Skip priority fee parameters when set to 'auto' to avoid API errors
    if (priorityFee && priorityFee !== 'auto') {
      swapParams.append('priorityFee', priorityFee);
    }
    // Only add priorityFeeLevel if priorityFee is explicitly set to a numeric value
    if (priorityFee && priorityFee !== 'auto' && priorityFeeLevel) {
      swapParams.append('priorityFeeLevel', priorityFeeLevel);
    }
    if (fee) swapParams.append('fee', fee);
    if (feeType) swapParams.append('feeType', feeType);

    const solanaApiKey = Deno.env.get('SOLANA_KEY');
    if (!solanaApiKey) {
      throw new Error('SOLANA_KEY environment variable is not set');
    }

    console.log('Requesting swap from Solana Tracker API...');
    console.log('Swap parameters:', {
      from,
      to,
      fromAmount: amount,
      slippage,
      payer,
      url: `https://swap-v2.solanatracker.io/swap?${swapParams.toString()}`
    });
    
    // Make request to Solana Tracker Swap API
    const response = await fetch(`https://swap-v2.solanatracker.io/swap?${swapParams.toString()}`, {
      method: 'GET',
      headers: {
        'x-api-key': solanaApiKey,
        'Accept': 'application/json'
      }
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

    console.log('Swap response received:', {
      success: swapData.success,
      hasTransaction: !!swapData.txn,
      type: swapData.type,
      rate: swapData.rate
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
    console.error('Error in get-swap function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
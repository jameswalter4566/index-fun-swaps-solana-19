import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import jwt from 'https://esm.sh/jsonwebtoken@9.0.0'

// Define CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-api-token',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  // Handle preflight (OPTIONS) requests first
  if (req.method === 'OPTIONS') {
    return new Response('OK', { 
      status: 204,
      headers: CORS_HEADERS 
    })
  }

  // Main request handling (e.g., POST)
  try {
    // Only try to parse JSON for actual requests (not OPTIONS)
    const { walletAddress, signature, message } = await req.json()
    
    if (!walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Wallet address, signature, and message are required' }),
        { 
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { 
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Here you would verify the signature with the wallet's public key
    // For now, we'll trust the wallet address
    // In production, you should verify the signature using @solana/web3.js
    console.log('Authenticating wallet:', walletAddress)

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    let userId
    
    if (!existingUser) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { 
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          }
        )
      }
      userId = newUser.id
    } else {
      userId = existingUser.id
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
    }

    // Create JWT token using a static secret
    const token = jwt.sign(
      { 
        wallet_address: walletAddress,
        user_id: userId,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      'index-fun-swaps-static-secret-2024'
    )

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: userId,
          wallet_address: walletAddress,
        }
      }),
      { 
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in auth-wallet function:', error)
    
    // Handle JSON parse errors or other exceptions
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    )
  }
})

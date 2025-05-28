import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Hardcoded recent coins data
    const recentCoins = [
      {
        symbol: "TRUMP",
        name: "Official Trump",
        address: "HWp6qhMXzLZrNPuNQmu65HQhzNEXTDtaYxBL8jz1pump",
        price: 45.98,
        marketCap: 9200000000,
        confidence: 'high',
        reason: 'Official Trump memecoin with massive political momentum',
        logo: 'https://dd.dexscreener.com/ds-data/tokens/solana/HWp6qhMXzLZrNPuNQmu65HQhzNEXTDtaYxBL8jz1pump.png',
        priceChange24h: 234.5
      },
      {
        symbol: "MELANIA",
        name: "Melania Meme",
        address: "5s2hKgAQW96MHTbq5GjKU4uwR25Ci8QrruHjcT8Epump",
        price: 5.21,
        marketCap: 1040000000,
        confidence: 'high',
        reason: 'Official Melania token launched by First Lady',
        logo: 'https://dd.dexscreener.com/ds-data/tokens/solana/5s2hKgAQW96MHTbq5GjKU4uwR25Ci8QrruHjcT8Epump.png',
        priceChange24h: 89.7
      },
      {
        symbol: "ai16z",
        name: "ai16z",
        address: "9RSfJCgcqBQP6vKmRvJmMRU4fqVm1LmcGPYLSfBZpump",
        price: 1.68,
        marketCap: 1680000000,
        confidence: 'medium',
        reason: 'Leading AI agent token with strong community',
        logo: 'https://dd.dexscreener.com/ds-data/tokens/solana/9RSfJCgcqBQP6vKmRvJmMRU4fqVm1LmcGPYLSfBZpump.png',
        priceChange24h: -12.3
      },
      {
        symbol: "ELIZA",
        name: "ELIZA",
        address: "FqMRkQQfgfJeRvDBqezFWkPZggebnY5jR8HsZT8Apump",
        price: 0.0421,
        marketCap: 42100000,
        confidence: 'medium',
        reason: 'AI agent framework token gaining developer adoption',
        logo: 'https://dd.dexscreener.com/ds-data/tokens/solana/FqMRkQQfgfJeRvDBqezFWkPZggebnY5jR8HsZT8Apump.png',
        priceChange24h: 15.8
      },
      {
        symbol: "GOAT",
        name: "Goatseus Maximus",
        address: "5vPgKKrCsynyrvQsV3jaMedfxJWGfwZ9Ld6R98pump",
        price: 0.389,
        marketCap: 389000000,
        confidence: 'low',
        reason: 'First AI-created memecoin with cult following',
        logo: 'https://dd.dexscreener.com/ds-data/tokens/solana/5vPgKKrCsynyrvQsV3jaMedfxJWGfwZ9Ld6R98pump.png',
        priceChange24h: -5.2
      }
    ];

    return new Response(
      JSON.stringify({ 
        success: true,
        coins: recentCoins 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in display-recent-coins:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
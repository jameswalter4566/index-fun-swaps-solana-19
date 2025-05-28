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
        symbol: "CHRISTINE",
        name: "FIRST FART ATTACK VICTIM",
        address: "J7yvpbShxTuumuovJ1kJe17JN9RtNHFCFtbWL9Bwpump",
        price: 0.000028677254962367262,
        marketCap: 28677.254962367264,
        confidence: 'low',
        reason: 'New memecoin with growing community',
        logo: 'https://image.solanatracker.io/proxy?url=https%3A%2F%2Fipfs-forward.solanatracker.io%2Fipfs%2Fbafkreieau2oyjrznj3urpxibmx2yyj5yrvbjjvbd7ixt53ubhd7ettx2te',
        priceChange24h: -48.93
      },
      {
        symbol: "RFM",
        name: "RareFishMarket",
        address: "78taWtddNwhsZSBtWu4HqD7TDXYxg3j18K6K5UHdpump",
        price: 0.00004735100727098856,
        marketCap: 47350.48572080379,
        confidence: 'low',
        reason: 'High volume trading activity',
        logo: 'https://image.solanatracker.io/proxy?url=https%3A%2F%2Fipfs-forward.solanatracker.io%2Fipfs%2Fbafkreidsmk42u7ws5w3egyxgu2or4v2g6j3x2yikxpw2p4rzevra6mtere',
        priceChange24h: -45.14
      },
      {
        symbol: "MEALY",
        name: "Mealy",
        address: "J1cGm3nJcfHjLEnTGwbTTqV3kKYmEuEUgyJ6K2fL3SRj",
        price: 0,
        marketCap: 0,
        confidence: 'low',
        reason: 'AI-powered recipe app token',
        logo: 'https://image.solanatracker.io/proxy?url=https%3A%2F%2Fipfs-forward.solanatracker.io%2Fipfs%2Fbafkreibx7dulvfiwgyv5yjrixodrjsod4kmcbptuiycgbq4m35hv7chrt4',
        priceChange24h: -100
      },
      {
        symbol: "DHUK",
        name: "DHUK",
        address: "4inmnMuvcsC53J9V7pHoXvNZd3NwEvkezfht7XrBpump",
        price: 0.00005644508056158,
        marketCap: 56445.065185065716,
        confidence: 'medium',
        reason: 'Community-driven duck token',
        logo: 'https://image.solanatracker.io/proxy?url=https%3A%2F%2Fipfs-forward.solanatracker.io%2Fipfs%2FQmUk3e6sdJUG6G9rsjLBscrav43ZXzN9VA2mN7R1765nrz',
        priceChange24h: -19.75
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
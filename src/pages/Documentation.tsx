import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Documentation = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
          <p className="text-xl text-gray-400">
            Build powerful AI trading assistants with our comprehensive API
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <GlassCard glow className="p-8">
              <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Introduction</h3>
                  <p className="text-gray-300 leading-relaxed">
                    The Guardian API allows you to create, deploy, and interact with AI-powered trading assistants 
                    that monitor social media, analyze market trends, and provide personalized trading recommendations. 
                    Our API supports both REST endpoints and WebSocket connections for real-time communication.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Real-time monitoring of Twitter KOLs and influencers</li>
                    <li>AI-powered coin recommendations based on social sentiment</li>
                    <li>Voice-enabled trading assistant interactions</li>
                    <li>Customizable trading parameters and filters</li>
                    <li>WebSocket support for live price and recommendation updates</li>
                    <li>Historical data analysis and backtesting capabilities</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Use Cases</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Automated trading bots based on KOL activity</li>
                    <li>Social sentiment analysis dashboards</li>
                    <li>Custom trading strategies using Guardian intelligence</li>
                    <li>Real-time market alerts and notifications</li>
                    <li>Voice-enabled trading interfaces</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="authentication">
            <GlassCard glow className="p-8">
              <h2 className="text-2xl font-bold mb-6">Authentication</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">API Key Authentication</h3>
                  <p className="text-gray-300 mb-4">
                    All API requests require authentication using an API key. Include your API key in the request headers:
                  </p>
                  
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                    <code className="text-purple-400">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Obtaining API Keys</h3>
                  <p className="text-gray-300 mb-4">
                    To request an API key, please send an email to <a href="mailto:API@guardian.cash" className="text-purple-400 hover:text-purple-300 underline">API@guardian.cash</a> 
                    with your use case and expected volume. Our team will review your request and provide access within 24-48 hours.
                  </p>
                  
                  <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
                    <p className="text-yellow-200 text-sm">
                      <strong>Security Notice:</strong> Keep your API keys secure and never expose them in client-side code.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Rate Limits</h3>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-2 text-gray-400">Plan</th>
                        <th className="py-2 text-gray-400">Requests/Min</th>
                        <th className="py-2 text-gray-400">Concurrent Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">Free</td>
                        <td className="py-2">10</td>
                        <td className="py-2">1</td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-2">Pro</td>
                        <td className="py-2">100</td>
                        <td className="py-2">5</td>
                      </tr>
                      <tr>
                        <td className="py-2">Enterprise</td>
                        <td className="py-2">Unlimited</td>
                        <td className="py-2">Unlimited</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="space-y-6">
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">Voice Session Endpoints</h2>
                
                <div className="space-y-8">
                  <div className="border-l-4 border-purple-500 pl-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">POST</span>
                      <code className="text-lg font-mono">/api/v1/guardians</code>
                    </div>
                    <p className="text-gray-300 mb-4">Create a new AI trading guardian with custom parameters</p>
                    
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm mb-4">
                      <pre>{`{
  "name": "My Trading Guardian",
  "description": "A guardian that monitors crypto KOLs",
  "kol_accounts": ["@elonmusk", "@VitalikButerin"],
  "language": "en-US",
  "filters": {
    "min_market_cap": 100000,
    "max_market_cap": 10000000,
    "min_liquidity": 50000,
    "min_holder_count": 100
  },
  "voice_enabled": true
}`}</pre>
                    </div>
                    
                    <h4 className="font-semibold mb-2">Response</h4>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                      <pre>{`{
  "guardian_id": "guard_abc123xyz",
  "status": "active",
  "websocket_url": "wss://api.guardian.cash/ws/guard_abc123xyz",
  "api_endpoints": {
    "recommendations": "/api/v1/guardians/guard_abc123xyz/recommendations",
    "voice_session": "/api/v1/guardians/guard_abc123xyz/voice"
  }
}`}</pre>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold">DELETE</span>
                      <code className="text-lg font-mono">/api/v1/guardians/:guardian_id</code>
                    </div>
                    <p className="text-gray-300 mb-4">Delete a guardian and all associated data</p>
                    
                    <h4 className="font-semibold mb-2">Response</h4>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                      <pre>{`{
  "status": "deleted",
  "guardian_id": "guard_abc123xyz",
  "message": "Guardian successfully deleted"
}`}</pre>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">WebSocket Protocol</h2>
                
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Once a session is created, connect to the WebSocket URL to establish real-time communication.
                  </p>
                  
                  <h3 className="text-xl font-semibold">Message Types</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="font-mono text-purple-400 mb-2">audio.data</h4>
                      <p className="text-sm text-gray-300 mb-2">Send audio data to the agent</p>
                      <pre className="text-sm">{`{
  "type": "audio.data",
  "data": "base64_encoded_audio"
}`}</pre>
                    </div>
                    
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="font-mono text-purple-400 mb-2">transcript.partial</h4>
                      <p className="text-sm text-gray-300 mb-2">Receive partial transcription results</p>
                      <pre className="text-sm">{`{
  "type": "transcript.partial",
  "text": "What's the current price of...",
  "confidence": 0.95
}`}</pre>
                    </div>
                    
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="font-mono text-purple-400 mb-2">agent.response</h4>
                      <p className="text-sm text-gray-300 mb-2">Receive agent audio response</p>
                      <pre className="text-sm">{`{
  "type": "agent.response",
  "audio": "base64_encoded_audio",
  "text": "The current price of Bitcoin is..."
}`}</pre>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <GlassCard glow className="p-8">
              <h2 className="text-2xl font-bold mb-6">Code Examples</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">JavaScript/TypeScript</h3>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{`// Initialize voice session
// Create a new Guardian
const response = await fetch('https://api.guardian.cash/v1/guardians', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Crypto KOL Tracker',
    kol_accounts: ['@elonmusk', '@VitalikButerin'],
    filters: {
      min_market_cap: 100000,
      max_market_cap: 10000000
    }
  })
});

const { guardian_id, websocket_url } = await response.json();

// Connect to WebSocket
const ws = new WebSocket(websocket_url);

ws.onopen = () => {
  console.log('Connected to Guardian WebSocket');
  
  // Subscribe to real-time updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['recommendations', 'price_updates', 'kol_activity']
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'recommendation':
      // New coin recommendation from Guardian
      console.log('New recommendation:', message.coin);
      break;
    case 'kol_activity':
      // KOL posted about a coin
      console.log('KOL activity:', message.kol, message.coin);
      break;
    case 'price_update':
      // Real-time price update
      console.log('Price update:', message.symbol, message.price);
      break;
  }
};`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Python</h3>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{`import asyncio
import websockets
import json

async def voice_session():
    # Create session
    headers = {'Authorization': 'Bearer YOUR_API_KEY'}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            'https://api.guardian.cash/v1/guardians',
            headers=headers,
            json={
                'name': 'Python Guardian',
                'kol_accounts': ['@elonmusk'],
                'filters': {'min_market_cap': 100000}
            }
        ) as response:
            data = await response.json()
    
    # Connect to WebSocket
    async with websockets.connect(data['websocket_url']) as websocket:
        # Subscribe to updates
        await websocket.send(json.dumps({
            'type': 'subscribe',
            'channels': ['recommendations']
        }))
        
        # Handle incoming messages
        async for message in websocket:
            msg = json.loads(message)
            if msg['type'] == 'recommendation':
                print(f"New coin: {msg['coin']['symbol']} - ${msg['coin']['price']}"))`}</pre>
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Documentation;
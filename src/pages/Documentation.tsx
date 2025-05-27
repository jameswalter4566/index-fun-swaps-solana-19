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
            Integrate voice-enabled AI trading agents into your application
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
                    Our Voice API enables real-time communication with AI trading agents through WebRTC technology. 
                    Build interactive voice experiences that analyze market data, provide trading insights, and execute 
                    commands through natural language processing.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Real-time voice communication with sub-100ms latency</li>
                    <li>Advanced speech recognition and natural language understanding</li>
                    <li>Multi-language support with automatic translation</li>
                    <li>Customizable agent personalities and trading strategies</li>
                    <li>Secure end-to-end encryption for all communications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Use Cases</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Voice-controlled trading terminals</li>
                    <li>Automated market analysis and alerts</li>
                    <li>Educational trading assistants</li>
                    <li>Portfolio management interfaces</li>
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
                    API keys can be generated from your account dashboard. Each key is associated with specific 
                    permissions and rate limits.
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
                      <code className="text-lg font-mono">/api/v1/voice/session</code>
                    </div>
                    <p className="text-gray-300 mb-4">Create a new voice session with an AI trading agent</p>
                    
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm mb-4">
                      <pre>{`{
  "agent_type": "trading_assistant",
  "language": "en-US",
  "voice_config": {
    "provider": "openai",
    "voice_id": "nova"
  },
  "session_config": {
    "max_duration": 3600,
    "auto_end_silence": 30
  }
}`}</pre>
                    </div>
                    
                    <h4 className="font-semibold mb-2">Response</h4>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                      <pre>{`{
  "session_id": "sess_abc123xyz",
  "websocket_url": "wss://api.example.com/ws/sess_abc123xyz",
  "expires_at": "2024-01-01T12:00:00Z",
  "ice_servers": [...]
}`}</pre>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold">DELETE</span>
                      <code className="text-lg font-mono">/api/v1/voice/session/:session_id</code>
                    </div>
                    <p className="text-gray-300 mb-4">End an active voice session</p>
                    
                    <h4 className="font-semibold mb-2">Response</h4>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                      <pre>{`{
  "status": "ended",
  "duration": 245,
  "transcript_url": "https://api.example.com/transcripts/sess_abc123xyz"
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
const response = await fetch('https://api.example.com/v1/voice/session', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agent_type: 'trading_assistant',
    language: 'en-US'
  })
});

const { websocket_url, session_id } = await response.json();

// Connect to WebSocket
const ws = new WebSocket(websocket_url);

ws.onopen = () => {
  console.log('Connected to voice agent');
  
  // Start sending audio data
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Process and send audio chunks
    });
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'agent.response':
      // Play agent audio response
      playAudio(message.audio);
      break;
    case 'transcript.final':
      // Display final transcript
      console.log('User said:', message.text);
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
            'https://api.example.com/v1/voice/session',
            headers=headers,
            json={'agent_type': 'trading_assistant'}
        ) as response:
            data = await response.json()
    
    # Connect to WebSocket
    async with websockets.connect(data['websocket_url']) as websocket:
        # Send audio data
        audio_data = get_audio_stream()
        await websocket.send(json.dumps({
            'type': 'audio.data',
            'data': audio_data
        }))
        
        # Receive responses
        async for message in websocket:
            msg = json.loads(message)
            if msg['type'] == 'agent.response':
                play_audio(msg['audio'])`}</pre>
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
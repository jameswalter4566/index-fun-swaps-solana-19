import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore
import Vapi from '@vapi-ai/web';

export function VapiWebRTCDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const vapiRef = useRef<any>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Monitor WebRTC connection
  useEffect(() => {
    if (!vapiRef.current) return;

    // Access the internal WebRTC peer connection if available
    const checkWebRTCState = () => {
      try {
        // The Vapi SDK likely has an internal RTCPeerConnection
        // We'll check if audio is properly set up
        if (window.RTCPeerConnection) {
          addLog('WebRTC is supported in this browser');
        }
      } catch (e) {
        addLog('Error checking WebRTC: ' + e);
      }
    };

    checkWebRTCState();
  }, [isConnected]);

  const startWebRTCCall = async () => {
    try {
      addLog('🚀 Starting WebRTC call test...');
      
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      if (!publicKey) {
        addLog('❌ No public key found!');
        return;
      }

      // Create Vapi instance
      if (!vapiRef.current) {
        vapiRef.current = new Vapi(publicKey);
        addLog('✅ Vapi instance created');
      }

      const vapi = vapiRef.current;

      // CRITICAL: Set up audio BEFORE starting the call
      addLog('Setting up audio context...');
      
      // Create an audio context to ensure audio permissions
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        addLog('✅ Audio context resumed');
      }

      // Set up comprehensive event listeners
      vapi.on('call-start', () => {
        addLog('🎉 CALL STARTED - WebRTC connection established');
        setIsConnected(true);
      });

      vapi.on('call-end', () => {
        addLog('📞 Call ended');
        setIsConnected(false);
      });

      vapi.on('speech-start', () => {
        addLog('🔊 SPEECH START - Assistant is speaking');
      });

      vapi.on('speech-end', () => {
        addLog('🔇 SPEECH END - Assistant stopped speaking');
      });

      vapi.on('message', (msg: any) => {
        addLog(`📨 Message type: ${msg.type}`);
        if (msg.type === 'transcript' && msg.transcript) {
          addLog(`💬 ${msg.role}: ${msg.transcript}`);
        }
      });

      vapi.on('error', (error: any) => {
        addLog(`❌ ERROR: ${JSON.stringify(error)}`);
      });

      // Monitor connection state changes
      vapi.on('connection-state-change', (state: any) => {
        addLog(`🔌 Connection state: ${state}`);
      });

      // Start the call with minimal config to reduce failure points
      addLog('📞 Initiating call...');
      const call = await vapi.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US"
        },
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: "You are a helpful assistant testing WebRTC audio. Start by saying 'Testing, testing, one two three. Can you hear me?'"
          }]
        },
        voice: {
          provider: "openai",
          voiceId: "alloy" // Most basic OpenAI voice
        },
        name: "WebRTC Test Assistant"
      });

      addLog(`✅ Call object created: ${call.id}`);
      
      // Check for audio tracks after a delay
      setTimeout(() => {
        checkAudioTracks();
      }, 2000);

    } catch (error: any) {
      addLog(`❌ Fatal error: ${error.message}`);
      console.error(error);
    }
  };

  const checkAudioTracks = () => {
    addLog('🔍 Checking for audio tracks...');
    
    // Check all audio elements on the page
    const audioElements = document.querySelectorAll('audio');
    addLog(`Found ${audioElements.length} audio elements`);
    
    audioElements.forEach((audio, index) => {
      addLog(`Audio ${index}: src=${audio.src || 'no-src'}, paused=${audio.paused}, readyState=${audio.readyState}`);
      
      // Try to play each audio element
      if (audio.paused && audio.src) {
        audio.play().then(() => {
          addLog(`✅ Audio ${index} playing`);
        }).catch(e => {
          addLog(`❌ Audio ${index} play failed: ${e.message}`);
        });
      }
    });

    // Check for WebRTC peer connections
    if ((window as any).RTCPeerConnection) {
      addLog('WebRTC peer connections may exist (cannot directly access due to encapsulation)');
    }
  };

  const stopCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      addLog('🛑 Call stopped');
    }
  };

  const testMicrophoneAccess = async () => {
    try {
      addLog('🎤 Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('✅ Microphone access granted');
      
      // Get audio tracks
      const tracks = stream.getAudioTracks();
      tracks.forEach(track => {
        addLog(`Audio track: ${track.label}, enabled: ${track.enabled}`);
      });
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
    } catch (e: any) {
      addLog(`❌ Microphone access failed: ${e.message}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Vapi WebRTC Debug Tool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> The Vapi Web SDK uses WebRTC for audio, not WebSocket. 
              This tool checks if WebRTC audio streams are properly established.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={testMicrophoneAccess} variant="outline">
              Test Microphone
            </Button>
            <Button onClick={startWebRTCCall} disabled={isConnected}>
              Start WebRTC Call
            </Button>
            <Button onClick={stopCall} variant="secondary" disabled={!isConnected}>
              Stop Call
            </Button>
            <Button onClick={checkAudioTracks} variant="outline">
              Check Audio Tracks
            </Button>
            <Button onClick={() => setLogs([])} variant="ghost">
              Clear Logs
            </Button>
          </div>

          <div className="bg-black/5 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Click "Test Microphone" first, then "Start WebRTC Call"...</p>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className={
                    log.includes('ERROR') ? 'text-red-600' : 
                    log.includes('✅') ? 'text-green-600' :
                    log.includes('🔊') ? 'text-blue-600 font-bold' :
                    ''
                  }
                >
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Expected flow:</strong></p>
            <ol className="list-decimal ml-6">
              <li>Test Microphone - Should show "access granted"</li>
              <li>Start WebRTC Call - Should show "CALL STARTED"</li>
              <li>Within 2-3 seconds - Should show "SPEECH START"</li>
              <li>If no audio, click "Check Audio Tracks"</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
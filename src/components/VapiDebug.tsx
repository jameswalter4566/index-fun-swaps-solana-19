import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore
import Vapi from '@vapi-ai/web';

export function VapiDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const vapiRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testVapiSetup = async () => {
    try {
      addLog('Starting Vapi test...');
      
      // Check for public key
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      if (!publicKey) {
        addLog('❌ ERROR: VITE_VAPI_PUBLIC_KEY not found!');
        return;
      }
      addLog(`✅ Public key found: ${publicKey.substring(0, 8)}...`);

      // Initialize Vapi
      if (!vapiRef.current) {
        addLog('Creating Vapi instance...');
        vapiRef.current = new Vapi(publicKey);
        addLog('✅ Vapi instance created');
      }

      const vapi = vapiRef.current;

      // Create audio element
      if (!audioRef.current) {
        addLog('Creating audio element...');
        const audio = new Audio();
        audio.id = 'vapi-debug-audio';
        audio.autoplay = true;
        
        // Add audio event listeners
        audio.addEventListener('play', () => addLog('🔊 Audio: play event'));
        audio.addEventListener('pause', () => addLog('⏸️ Audio: pause event'));
        audio.addEventListener('error', (e) => addLog(`❌ Audio error: ${JSON.stringify(e)}`));
        audio.addEventListener('canplay', () => addLog('✅ Audio: can play'));
        
        document.body.appendChild(audio);
        audioRef.current = audio;
        
        // Attach to Vapi
        vapi.attachAudio(audio);
        addLog('✅ Audio element created and attached');
      }

      // Set up all event listeners
      vapi.removeAllListeners(); // Clear any existing listeners
      
      vapi.on('call-start', () => {
        addLog('📞 CALL STARTED');
      });

      vapi.on('call-end', () => {
        addLog('📞 CALL ENDED');
      });

      vapi.on('speech-start', () => {
        addLog('🔊 ASSISTANT SPEAKING');
      });

      vapi.on('speech-end', () => {
        addLog('🔇 ASSISTANT STOPPED');
      });

      vapi.on('volume-level', (level: number) => {
        if (level > 0) {
          addLog(`🎚️ Volume level: ${(level * 100).toFixed(0)}%`);
        }
      });

      vapi.on('message', (msg: any) => {
        addLog(`📨 Message: ${JSON.stringify(msg).substring(0, 100)}...`);
      });

      vapi.on('error', (error: any) => {
        addLog(`❌ ERROR: ${JSON.stringify(error)}`);
      });

      // Start call with minimal config
      addLog('Starting call...');
      
      const call = await vapi.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US"
        },
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo", // Using cheaper model for testing
          messages: [{
            role: "system",
            content: "You are a helpful assistant. Say hello and ask how you can help."
          }],
          temperature: 0.7
        },
        voice: {
          provider: "openai", // Try OpenAI voice instead of 11labs
          voiceId: "nova" // OpenAI's nova voice
        },
        name: "Debug Assistant",
        firstMessage: "Hello! This is a test. Can you hear me?",
        firstMessageMode: "assistant-speaks-first",
        clientMessages: ["transcript", "assistant_response", "speech-start", "speech-end", "hang"]
      });

      addLog(`✅ Call started: ${JSON.stringify(call).substring(0, 100)}...`);
      
      // Check audio element state
      setTimeout(() => {
        if (audioRef.current) {
          addLog(`Audio state: paused=${audioRef.current.paused}, muted=${audioRef.current.muted}, volume=${audioRef.current.volume}`);
          addLog(`Audio src: ${audioRef.current.src || 'No source'}`);
          
          // Try to play manually
          if (audioRef.current.paused) {
            addLog('Attempting manual play...');
            audioRef.current.play().then(() => {
              addLog('✅ Manual play successful');
            }).catch((e) => {
              addLog(`❌ Manual play failed: ${e.message}`);
            });
          }
        }
      }, 2000);

    } catch (error: any) {
      addLog(`❌ Fatal error: ${error.message}`);
      console.error(error);
    }
  };

  const stopCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      addLog('🛑 Call stopped');
    }
  };

  const checkAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      addLog(`Found ${audioOutputs.length} audio output devices:`);
      audioOutputs.forEach(d => {
        addLog(`  - ${d.label || 'Unnamed device'} (${d.deviceId})`);
      });
    } catch (e: any) {
      addLog(`❌ Error checking devices: ${e.message}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Vapi Audio Debug Tool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testVapiSetup}>Start Test Call</Button>
            <Button onClick={stopCall} variant="secondary">Stop Call</Button>
            <Button onClick={checkAudioDevices} variant="outline">Check Audio Devices</Button>
            <Button onClick={() => setLogs([])} variant="ghost">Clear Logs</Button>
          </div>
          
          <div className="bg-black/5 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Click "Start Test Call" to begin debugging...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={log.includes('ERROR') ? 'text-red-600' : ''}>
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p>This tool will help identify why audio isn't playing. Look for:</p>
            <ul className="list-disc ml-6">
              <li>❌ ERROR messages</li>
              <li>Missing "ASSISTANT SPEAKING" logs</li>
              <li>Audio element state issues</li>
              <li>Voice provider errors</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
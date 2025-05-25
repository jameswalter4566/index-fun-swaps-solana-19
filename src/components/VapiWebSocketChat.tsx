import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function VapiWebSocketChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();
  
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize audio context
  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000 // Match Vapi's expected sample rate
      });
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      addLog('✅ Audio context initialized');
    }
  };

  // Convert Float32Array to Int16Array for PCM
  const float32ToInt16 = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    return int16Array;
  };

  // Play PCM audio data
  const playPCMAudio = async (pcmData: Int16Array) => {
    if (!audioContextRef.current) return;

    // Add to queue
    audioQueueRef.current.push(pcmData);

    // If not already playing, start playback
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      processAudioQueue();
    }
  };

  // Process audio queue
  const processAudioQueue = async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    const pcmData = audioQueueRef.current.shift()!;
    
    // Convert Int16 to Float32 for Web Audio API
    const float32Array = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Array[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7FFF);
    }

    // Create audio buffer
    const audioBuffer = audioContextRef.current.createBuffer(
      1, // mono
      float32Array.length,
      audioContextRef.current.sampleRate
    );
    audioBuffer.getChannelData(0).set(float32Array);

    // Play the buffer
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      // Process next chunk in queue
      processAudioQueue();
    };
    
    source.start();
  };

  // Start microphone capture
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      micStreamRef.current = stream;
      
      if (!audioContextRef.current) await initAudioContext();
      
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (!isMuted && websocketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          const pcmData = float32ToInt16(inputData);
          
          // Send as binary data
          websocketRef.current.send(pcmData.buffer);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);
      processorRef.current = processor;
      
      addLog('✅ Microphone started');
    } catch (error: any) {
      addLog(`❌ Microphone error: ${error.message}`);
      throw error;
    }
  };

  // Stop microphone
  const stopMicrophone = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    addLog('🔇 Microphone stopped');
  };

  // Start WebSocket call
  const startCall = async () => {
    try {
      addLog('🚀 Starting WebSocket call...');
      
      // Initialize audio
      await initAudioContext();
      await startMicrophone();
      
      // Create WebSocket call via edge function
      const { data, error } = await supabase.functions.invoke('vapi-websocket-call', {
        body: {
          assistantConfig: {
            model: {
              provider: "openai",
              model: "gpt-3.5-turbo",
              messages: [{
                role: "system",
                content: "You are a helpful AI trading assistant. Start by saying 'WebSocket audio test successful! I can hear you clearly.'"
              }],
              temperature: 0.7
            },
            voice: {
              provider: "openai",
              voiceId: "nova"
            },
            firstMessage: "WebSocket audio test successful! I can hear you clearly. How can I help you with trading today?",
            firstMessageMode: "assistant-speaks-first"
          }
        }
      });

      if (error) throw error;

      const { websocketUrl, callId } = data;
      addLog(`✅ Call created: ${callId}`);
      
      // Connect to WebSocket
      const ws = new WebSocket(websocketUrl);
      websocketRef.current = ws;
      
      ws.onopen = () => {
        addLog('🔌 WebSocket connected');
        setIsConnected(true);
      };
      
      ws.onclose = () => {
        addLog('🔌 WebSocket disconnected');
        setIsConnected(false);
        stopMicrophone();
      };
      
      ws.onerror = (error) => {
        addLog(`❌ WebSocket error: ${error}`);
      };
      
      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Binary audio data from assistant
          const arrayBuffer = await event.data.arrayBuffer();
          const pcmData = new Int16Array(arrayBuffer);
          addLog(`🔊 Received audio chunk: ${pcmData.length} samples`);
          playPCMAudio(pcmData);
        } else {
          // JSON control message
          try {
            const message = JSON.parse(event.data);
            addLog(`📨 Control message: ${JSON.stringify(message)}`);
          } catch (e) {
            addLog(`📝 Text message: ${event.data}`);
          }
        }
      };
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      toast({
        title: 'Connection Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // End call
  const endCall = () => {
    if (websocketRef.current) {
      // Send hangup message
      if (websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type: "hangup" }));
      }
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    stopMicrophone();
    setIsConnected(false);
    addLog('📞 Call ended');
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    addLog(isMuted ? '🎤 Unmuted' : '🔇 Muted');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Vapi WebSocket Audio Streaming</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              This uses WebSocket transport for direct PCM audio streaming. 
              The assistant's audio comes as raw PCM data that we play directly.
            </p>
          </div>

          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={startCall} className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Start WebSocket Call
              </Button>
            ) : (
              <>
                <Button onClick={endCall} variant="destructive" className="flex items-center gap-2">
                  <PhoneOff className="w-4 h-4" />
                  End Call
                </Button>
                <Button onClick={toggleMute} variant={isMuted ? "secondary" : "default"}>
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isMuted ? 'Unmuted' : 'Muted'}
                </Button>
              </>
            )}
            <Button onClick={() => setLogs([])} variant="ghost">
              Clear Logs
            </Button>
          </div>

          <div className="bg-black/5 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Click "Start WebSocket Call" to begin...</p>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className={
                    log.includes('❌') ? 'text-red-600' : 
                    log.includes('✅') ? 'text-green-600' :
                    log.includes('🔊') ? 'text-blue-600' :
                    ''
                  }
                >
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>How it works:</strong></p>
            <ul className="list-disc ml-6">
              <li>Creates a WebSocket call via Vapi API</li>
              <li>Streams your microphone as 16-bit PCM @ 16kHz</li>
              <li>Receives assistant's audio as PCM chunks</li>
              <li>Plays audio chunks in real-time</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
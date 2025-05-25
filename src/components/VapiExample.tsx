// Example implementation of Vapi Web SDK with proper audio setup
// This file demonstrates the correct way to use Vapi for browser-based voice calls

import React, { useEffect, useRef } from 'react';
// Uncomment when @vapi-ai/web is installed:
// import Vapi from '@vapi-ai/web';

export function VapiExample() {
  const vapiRef = useRef<any>(null); // Will be Vapi instance
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Vapi and audio on component mount
    const initializeVapi = async () => {
      // TODO: Uncomment when @vapi-ai/web is installed
      /*
      // Step 1: Create Vapi instance with public key
      if (!vapiRef.current) {
        const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
        if (!publicKey) {
          console.error('VITE_VAPI_PUBLIC_KEY not set in environment');
          return;
        }
        vapiRef.current = new Vapi(publicKey);
      }

      const vapi = vapiRef.current;

      // Step 2: Create and attach audio element (CRITICAL for hearing assistant)
      if (!audioRef.current) {
        const audio = new Audio();
        audio.id = 'vapi-audio-output';
        audio.autoplay = true; // Required for immediate playback
        document.body.appendChild(audio);
        audioRef.current = audio;
        
        // This is the key line - attaches Vapi's audio stream to the element
        vapi.attachAudio(audio);
      }

      // Step 3: Set up event listeners for debugging
      vapi.on('error', (e: any) => console.error('[Vapi Error]', e));
      vapi.on('message', (m: any) => console.log('[Vapi Message]', m));
      vapi.on('speech-start', () => console.log('🔊 Assistant speaking'));
      vapi.on('speech-end', () => console.log('🔇 Assistant stopped'));
      vapi.on('call-start', () => console.log('📞 Call started'));
      vapi.on('call-end', () => console.log('📞 Call ended'));

      // Step 4: Start call on user gesture (button click)
      const handleStartCall = async () => {
        try {
          const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
          
          const call = await vapi.start(assistantId || {
            // Inline assistant configuration
            transcriber: {
              provider: "deepgram",
              model: "nova-2",
              language: "en-US"
            },
            model: {
              provider: "openai",
              model: "gpt-4-turbo",
              messages: [{
                role: "system",
                content: "You are a helpful AI assistant. Be concise and friendly."
              }],
              temperature: 0.7
            },
            voice: {
              provider: "11labs",
              voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel voice
            },
            name: "Demo Assistant",
            firstMessage: "Hello! How can I help you today?",
            firstMessageMode: "assistant-speaks-first",
            // IMPORTANT: Include these to receive messages
            clientMessages: [
              "transcript",
              "assistant_response",
              "function-call",
              "hang",
              "speech-start",
              "speech-end"
            ]
          });

          console.log('Call started:', call);
        } catch (error) {
          console.error('Failed to start call:', error);
        }
      };

      // Attach to window for testing
      (window as any).startVapiCall = handleStartCall;
      console.log('Vapi initialized. Call window.startVapiCall() to test.');
      */
    };

    initializeVapi();

    // Cleanup on unmount
    return () => {
      if (vapiRef.current && typeof vapiRef.current.stop === 'function') {
        vapiRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, []);

  return null; // Audio element is added to body directly
}

/*
TROUBLESHOOTING GUIDE:

1. If you hear nothing but see transcripts:
   - Check that vapi.attachAudio(audio) was called
   - Verify audio.autoplay = true
   - Check browser console for autoplay policy errors
   
2. If you get "voice-tts-error":
   - Verify the voiceId exists in your 11Labs account
   - Check that the voice is licensed for real-time use
   
3. If speech-start fires but audio is paused:
   - Ensure the call was started by user gesture (button click)
   - Try audio.play() manually in console
   - Check if audio is going to different output device
   
4. Common mistakes:
   - Forgetting vapi.attachAudio()
   - Not including "assistant_response" in clientMessages
   - Missing firstMessageMode configuration
   - Not setting audio.autoplay = true
*/
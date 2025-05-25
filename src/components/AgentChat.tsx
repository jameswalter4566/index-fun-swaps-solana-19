import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, X, Phone, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// @ts-ignore - Package will be installed via npm
import Vapi from '@vapi-ai/web';

// Debug: Check if Vapi loaded
if (typeof Vapi !== 'undefined') {
  console.log('✅ Vapi SDK loaded successfully');
} else {
  console.error('❌ Vapi SDK failed to load! Check if @vapi-ai/web is installed');
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  coinRecommendations?: CoinRecommendation[];
}

interface CoinRecommendation {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// Define SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface AgentChatProps {
  agentName: string;
  agentId: string;
  isPersistent?: boolean;
}

const AgentChat: React.FC<AgentChatProps> = ({ agentName, agentId, isPersistent = false }) => {
  const [isOpen, setIsOpen] = useState(isPersistent);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastRecommendationCheckRef = useRef<Date>(new Date());
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const vapiRef = useRef<any>(null); // Will be Vapi instance when SDK is installed
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! I'm your ${agentName} trading agent. I'm monitoring Twitter accounts and market data to find opportunities for you. How can I help?`,
      sender: 'agent',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch new recommendations periodically
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data, error } = await supabase
          .from('coin_recommendations')
          .select('*')
          .eq('agent_id', agentId)
          .gte('created_at', lastRecommendationCheckRef.current.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        if (data && data.length > 0) {
          const recommendations = data.map((rec: any) => {
            const tokenData = rec.token_data;
            const pool = tokenData.pools?.[0];
            return {
              symbol: tokenData.token.symbol,
              name: tokenData.token.name,
              price: pool?.price?.usd || 0,
              marketCap: pool?.marketCap?.usd || 0,
              confidence: rec.confidence_score > 0.7 ? 'high' : rec.confidence_score > 0.5 ? 'medium' : 'low',
              reason: rec.recommendation_reason
            };
          });

          const newMessage: Message = {
            id: Date.now().toString(),
            text: '🚨 New coin opportunities detected!',
            sender: 'agent',
            timestamp: new Date(),
            coinRecommendations: recommendations
          };

          setMessages(prev => [...prev, newMessage]);
          lastRecommendationCheckRef.current = new Date();

          // Show notification if available
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Coin Recommendations', {
              body: `Found ${data.length} new opportunities!`,
              icon: '/imagelogo.jpg'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    // Check for recommendations on mount
    fetchRecommendations();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(fetchRecommendations, 30000);

    return () => clearInterval(interval);
  }, [agentId]);

  const startVoiceCall = async () => {
    console.log('🎯 startVoiceCall triggered!');
    try {
      // Initialize Vapi if not already done
      if (!vapiRef.current) {
        // HARDCODED PUBLIC KEY
        const publicKey = '098bd142-677b-40a8-ab39-11792cb7737b';
        console.log('📝 Using hardcoded public key');
        
        if (!publicKey) {
          const errorMsg = 'Public key not configured';
          console.error('❌', errorMsg);
          toast({
            title: 'Configuration Error',
            description: errorMsg,
            variant: 'destructive',
          });
          throw new Error(errorMsg);
        }
        
        console.log('🚀 Creating Vapi instance...');
        vapiRef.current = new Vapi(publicKey);
        
        // The SDK handles audio automatically via Daily.co
        // No need to manually create audio elements
        console.log('✅ Vapi SDK initialized - audio will be handled automatically');
      }

      const vapi = vapiRef.current;

      // Set up event listeners
      vapi.on('call-start', () => {
        console.log('Call started successfully');
        setIsVoiceCallActive(true);
        
        const voiceMessage: Message = {
          id: Date.now().toString(),
          text: '🎙️ Voice call started. Speak naturally with your agent!',
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, voiceMessage]);
      });

      vapi.on('call-end', () => {
        console.log('Call ended');
        setIsVoiceCallActive(false);
        setCurrentCallId(null);
        
        const endMessage: Message = {
          id: Date.now().toString(),
          text: '📞 Voice call ended.',
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, endMessage]);
      });

      vapi.on('speech-start', () => {
        console.log('Assistant started speaking');
      });

      vapi.on('speech-end', () => {
        console.log('Assistant finished speaking');
      });

      vapi.on('message', (message: any) => {
        console.log('Vapi message:', message);
        
        // Handle different message types
        if (message.type === 'transcript') {
          if (message.role === 'assistant' && message.transcript) {
            const assistantMessage: Message = {
              id: Date.now().toString(),
              text: message.transcript,
              sender: 'agent',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
          } else if (message.role === 'user' && message.transcript) {
            const userMessage: Message = {
              id: Date.now().toString(),
              text: message.transcript,
              sender: 'user',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);
          }
        } else if (message.type === 'assistant_response' && message.response) {
          // Handle final assistant response
          const assistantMessage: Message = {
            id: Date.now().toString(),
            text: message.response,
            sender: 'agent',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      });

      vapi.on('error', (error: any) => {
        console.error('Vapi error:', error);
        toast({
          title: 'Voice Call Error',
          description: error.message || 'An error occurred during the voice call',
          variant: 'destructive',
        });
      });

      vapi.on('volume-level', (volume: number) => {
        console.log(`Assistant volume: ${volume}`);
      });

      // Get assistant ID from environment or create inline
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      console.log('📋 Assistant ID:', assistantId || 'Using inline configuration');
      
      let call;
      console.log('📞 Starting Vapi call...');
      if (assistantId) {
        // Use pre-configured assistant with overrides
        call = await vapi.start(assistantId, {
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en-US",
          },
          model: {
            provider: "openai",
            model: "gpt-4-turbo",
            temperature: 0.7,
          },
          voice: {
            provider: "openai",
            voiceId: "nova", // OpenAI's nova voice - more reliable
          },
          firstMessage: `Hi! I'm ${agentName}, your AI trading assistant. I can help you analyze market trends and find trading opportunities. What would you like to know?`,
          variableValues: {
            agentName: agentName,
            agentId: agentId,
          },
          clientMessages: ["transcript", "assistant_response", "function-call", "hang", "speech-start", "speech-end"],
          firstMessageMode: "assistant-speaks-first",
        });
      } else {
        // Create inline assistant
        call = await vapi.start({
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en-US",
          },
          model: {
            provider: "openai",
            model: "gpt-4-turbo",
            messages: [
              {
                role: "system",
                content: `You are ${agentName}, an AI trading assistant. You help users analyze cryptocurrency markets and Twitter signals. You monitor Twitter accounts for trading opportunities and provide real-time market analysis. Be concise, professional, and focus on actionable trading insights.`,
              },
            ],
            temperature: 0.7,
          },
          voice: {
            provider: "openai",
            voiceId: "nova", // OpenAI's nova voice - more reliable
          },
          name: agentName,
          firstMessage: `Hi! I'm ${agentName}, your AI trading assistant. I can help you analyze market trends and find trading opportunities. What would you like to know?`,
          firstMessageMode: "assistant-speaks-first",
          clientMessages: ["transcript", "assistant_response", "function-call", "hang", "speech-start", "speech-end"],
        });
      }

      if (call?.id) {
        setCurrentCallId(call.id);
      }

      /* TEMPORARY: Use the current iframe approach until SDK is installed
      const { data, error } = await supabase.functions.invoke('smart-agent-speak', {
        body: {
          action: 'create-web-call',
          data: {
            agentId,
            agentName,
            firstMessage: `Hi! I'm ${agentName}, your AI trading assistant. I can help you analyze market trends and find trading opportunities. What would you like to know?`,
            metadata: {
              chatHistory: messages.slice(-5),
            },
          },
        },
      });

      if (error) throw error;

      if (data?.data?.webCallUrl && data?.data?.callId) {
        setCurrentCallId(data.data.callId);
        setIsVoiceCallActive(true);

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = data.data.webCallUrl;
        iframe.style.position = 'fixed';
        iframe.style.bottom = '20px';
        iframe.style.right = '420px';
        iframe.style.width = '350px';
        iframe.style.height = '500px';
        iframe.style.border = '1px solid #e5e7eb';
        iframe.style.borderRadius = '12px';
        iframe.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        iframe.style.zIndex = '9999';
        iframe.allow = 'microphone; autoplay';
        
        document.body.appendChild(iframe);
        
        // Store iframe reference in vapiRef temporarily
        vapiRef.current = iframe;

        const voiceMessage: Message = {
          id: Date.now().toString(),
          text: '🎙️ Voice call started. Speak naturally with your agent!',
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, voiceMessage]);
      } */
    } catch (error) {
      console.error('Error starting voice call:', error);
      toast({
        title: 'Voice Call Error',
        description: 'Failed to start voice call. Please check your microphone permissions.',
        variant: 'destructive',
      });
    }
  };

  const endVoiceCall = async () => {
    try {
      if (vapiRef.current && typeof vapiRef.current.stop === 'function') {
        vapiRef.current.stop();
      }

      /* TEMPORARY: Handle iframe cleanup
      if (currentCallId) {
        await supabase.functions.invoke('smart-agent-speak', {
          body: {
            action: 'end-call',
            data: {
              callId: currentCallId,
            },
          },
        });
      }

      // Remove iframe if it exists
      if (vapiRef.current && vapiRef.current instanceof HTMLIFrameElement) {
        vapiRef.current.remove();
        vapiRef.current = null;
      } */

      setIsVoiceCallActive(false);
      setCurrentCallId(null);

      // Add message about voice call ending
      const endMessage: Message = {
        id: Date.now().toString(),
        text: '📞 Voice call ended.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, endMessage]);
    } catch (error) {
      console.error('Error ending voice call:', error);
    }
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Process user message and generate response
    setTimeout(async () => {
      let responseText = 'I\'m analyzing the market for you...';
      
      if (messageText.toLowerCase().includes('recommend') || messageText.toLowerCase().includes('opportunity')) {
        // Fetch latest recommendations
        try {
          const { data, error } = await supabase
            .from('coin_recommendations')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(3);

          if (data && data.length > 0) {
            responseText = 'Here are my latest recommendations based on your filters:';
            const recommendations = data.map((rec: {
              token_data: any;
              confidence_score: number;
              recommendation_reason: string;
            }) => {
              const tokenData = rec.token_data;
              const pool = tokenData.pools?.[0];
              return {
                symbol: tokenData.token.symbol,
                name: tokenData.token.name,
                price: pool?.price?.usd || 0,
                marketCap: pool?.marketCap?.usd || 0,
                confidence: rec.confidence_score > 0.7 ? 'high' : rec.confidence_score > 0.5 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
                reason: rec.recommendation_reason
              };
            });

            const agentResponse: Message = {
              id: (Date.now() + 1).toString(),
              text: responseText,
              sender: 'agent',
              timestamp: new Date(),
              coinRecommendations: recommendations
            };
            setMessages(prev => [...prev, agentResponse]);
          } else {
            responseText = 'No recommendations found yet. Make sure you\'ve configured your filters in the Agent Configuration section.';
            const agentResponse: Message = {
              id: (Date.now() + 1).toString(),
              text: responseText,
              sender: 'agent',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, agentResponse]);
          }
        } catch (error) {
          console.error('Error fetching recommendations:', error);
          responseText = 'Sorry, I encountered an error while fetching recommendations.';
          const agentResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: responseText,
            sender: 'agent',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, agentResponse]);
        }
      } else {
        // General response
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'I\'m monitoring the market for opportunities based on your configured filters. Ask me for recommendations or wait for automatic alerts!',
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentResponse]);
      }
    }, 1000);
  };

  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(2);
    if (price < 1) return price.toFixed(8);
    return price.toFixed(2);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`;
    return `$${marketCap.toFixed(0)}`;
  };

  // Initialize speech recognition
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        
        if (event.results[last].isFinal) {
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Cleanup on unmount
    return () => {
      if (vapiRef.current && typeof vapiRef.current.stop === 'function') {
        vapiRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  if (isPersistent) {
    return (
      <div className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg">{agentName} Trading Agent</CardTitle>
          <div className="flex items-center gap-2">
            {isVoiceCallActive ? (
              <Button
                variant="destructive"
                size="icon"
                onClick={endVoiceCall}
                className="h-8 w-8"
                title="End voice call"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                onClick={startVoiceCall}
                className="h-8 w-8 bg-green-600 hover:bg-green-700"
                title="Start voice call"
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col flex-1">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.sender === 'user'
                        ? 'bg-stake-accent text-white'
                        : 'bg-stake-card'
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                    
                    {message.coinRecommendations && (
                      <div className="mt-3 space-y-2">
                        {message.coinRecommendations.map((coin) => (
                          <div
                            key={coin.symbol}
                            className="bg-black/20 rounded-md p-3 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">{coin.symbol}</span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs",
                                  coin.confidence === 'high' && 'bg-green-500/20 text-green-400',
                                  coin.confidence === 'medium' && 'bg-yellow-500/20 text-yellow-400',
                                  coin.confidence === 'low' && 'bg-red-500/20 text-red-400'
                                )}
                              >
                                {coin.confidence} confidence
                              </span>
                            </div>
                            <div className="text-gray-400 space-y-0.5">
                              <div>Price: ${formatPrice(coin.price)}</div>
                              <div>Market Cap: {formatMarketCap(coin.marketCap)}</div>
                              <div className="italic">{coin.reason}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="text-center text-xs text-gray-500 mb-2">
              👆 Use GREEN phone button above for AI voice chat
            </div>
            <div className="flex items-center justify-center">
              <Button
                onClick={toggleListening}
                className={cn(
                  "w-16 h-16 rounded-full transition-all",
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                    : "bg-stake-accent hover:bg-stake-highlight",
                  "flex items-center justify-center"
                )}
                disabled={isVoiceCallActive}
                title="Speech-to-text only (no voice response) - Use green phone button for voice chat!"
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
            </div>
            {isListening && (
              <p className="text-center text-sm text-stake-muted mt-2">
                Listening... speak now
              </p>
            )}
          </div>
          
          {isVoiceCallActive && (
            <div className="px-4 pb-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-600">
                🎙️ Voice call active - Speak naturally with your agent
              </div>
            </div>
          )}
        </CardContent>
      </div>
    );
  }

  return (
    <>
      {/* Microphone Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-16 h-16 rounded-full shadow-lg transition-all",
            "bg-stake-accent hover:bg-stake-highlight",
            "flex items-center justify-center"
          )}
        >
          <Mic className="w-6 h-6" />
        </Button>
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-sm bg-black/80 text-white px-2 py-1 rounded">
          Talk with Agent
        </span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-8 w-96 h-[600px] z-50 shadow-2xl animate-in slide-in-from-bottom-5">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-lg">{agentName} Trading Agent</CardTitle>
            <div className="flex items-center gap-2">
              {isVoiceCallActive ? (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={endVoiceCall}
                  className="h-8 w-8"
                  title="End voice call"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="icon"
                  onClick={startVoiceCall}
                  className="h-8 w-8 bg-green-600 hover:bg-green-700"
                  title="Start Vapi voice call - Click this for AI voice chat!"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex flex-col h-[calc(100%-73px)]">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.sender === 'user'
                          ? 'bg-stake-accent text-white'
                          : 'bg-stake-card'
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                      
                      {message.coinRecommendations && (
                        <div className="mt-3 space-y-2">
                          {message.coinRecommendations.map((coin) => (
                            <div
                              key={coin.symbol}
                              className="bg-black/20 rounded-md p-3 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold">{coin.symbol}</span>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded text-xs",
                                    coin.confidence === 'high' && 'bg-green-500/20 text-green-400',
                                    coin.confidence === 'medium' && 'bg-yellow-500/20 text-yellow-400',
                                    coin.confidence === 'low' && 'bg-red-500/20 text-red-400'
                                  )}
                                >
                                  {coin.confidence} confidence
                                </span>
                              </div>
                              <div className="text-gray-400 space-y-0.5">
                                <div>Price: ${formatPrice(coin.price)}</div>
                                <div>Market Cap: {formatMarketCap(coin.marketCap)}</div>
                                <div className="italic">{coin.reason}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-xs opacity-60 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about trading opportunities..."
                className="flex-1"
                disabled={isVoiceCallActive}
              />
              
              <Button
                size="icon"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isVoiceCallActive}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {isVoiceCallActive && (
              <div className="px-4 pb-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-600">
                  🎙️ Voice call active - Speak naturally with your agent
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AgentChat;
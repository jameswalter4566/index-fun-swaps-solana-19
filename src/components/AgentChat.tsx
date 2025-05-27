import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, X, Phone, PhoneOff, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import NodeVisualizer from '@/components/NodeVisualizer';
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
  text?: string;
  sender: 'user' | 'agent' | 'tweet' | 'mention' | 'recommendation';
  timestamp: Date;
  coinRecommendations?: CoinRecommendation[];
  tweetData?: TweetData;
  expandable?: boolean;
  expanded?: boolean;
}

interface CoinRecommendation {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  logo?: string;
  priceChange24h?: number;
}

interface TweetData {
  id: string;
  text: string;
  author: string;
  authorImage?: string;
  createdAt: string;
  likes?: number;
  retweets?: number;
  replies?: number;
}

interface Token {
  address: string;
  name: string;
  symbol: string;
  image: string;
  metadata?: any;
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
  indexTokens?: Token[];
  twitterAccounts?: Token[];
  onCoinSelect?: (coin: any) => void;
}

const AgentChat: React.FC<AgentChatProps> = ({ 
  agentName, 
  agentId, 
  isPersistent = false, 
  indexTokens = [], 
  twitterAccounts = [], 
  onCoinSelect 
}) => {
  // All hooks must be defined before any conditional logic
  const [isOpen, setIsOpen] = useState(isPersistent);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastRecommendationCheckRef = useRef<Date>(new Date());
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const vapiRef = useRef<any>(null);
  const [showAgentMakeup, setShowAgentMakeup] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! I'm your ${agentName} trading agent. Click the green phone button to hear my analysis of the latest tweets and coin recommendations!`,
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

  const fetchTweets = async () => {
    try {
      const twitterUsernames = indexTokens
        .filter(token => token.name?.startsWith('@'))
        .map(token => token.name);

      if (twitterUsernames.length === 0) {
        console.log('No Twitter accounts found in index');
        return [];
      }

      console.log('Fetching tweets for:', twitterUsernames);

      try {
        const { data: fetchResult, error: fetchError } = await supabase.functions.invoke('retrieve-new-tweets', {
          body: {
            usernames: twitterUsernames,
            agentId: agentId,
            forceFresh: false
          }
        });

        if (fetchError) {
          console.error('Error fetching new tweets:', fetchError);
        } else {
          console.log('Tweet fetch result:', fetchResult);
        }
      } catch (err) {
        console.error('Error calling retrieve-new-tweets:', err);
      }

      const cleanUsernames = twitterUsernames.map(u => u.replace('@', ''));
      const { data: tweets, error } = await supabase
        .from('kol_tweets')
        .select('*')
        .in('author_username', cleanUsernames)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const tweetMessages: Message[] = tweets?.map(tweet => ({
        id: `tweet-${tweet.tweet_id}`,
        sender: 'tweet' as const,
        timestamp: new Date(tweet.created_at),
        tweetData: {
          id: tweet.tweet_id,
          text: tweet.tweet_text,
          author: `@${tweet.author_username}`,
          authorImage: indexTokens.find(t => t.name === `@${tweet.author_username}`)?.image || tweet.author_profile_image_url,
          createdAt: tweet.created_at,
          likes: tweet.metrics?.likes || 0,
          retweets: tweet.metrics?.retweets || 0,
          replies: tweet.metrics?.replies || 0,
        },
        expandable: true,
        expanded: false,
      })) || [];

      return tweetMessages;
    } catch (error) {
      console.error('Error fetching tweets:', error);
      return [];
    }
  };

  const fetchMentions = async () => {
    try {
      const twitterUsernames = indexTokens
        .filter(token => token.name?.startsWith('@'))
        .map(token => token.name.substring(1));

      if (twitterUsernames.length === 0) {
        return [];
      }

      const { data: mentions, error } = await supabase
        .from('kol_tweets')
        .select('*')
        .textSearch('tweet_text', twitterUsernames.map(u => `@${u}`).join(' | '))
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching mentions:', error);
        return [];
      }

      const filteredMentions = mentions?.filter(tweet => {
        const tweetLower = tweet.tweet_text.toLowerCase();
        return twitterUsernames.some(username => 
          tweetLower.includes(`@${username.toLowerCase()}`)
        );
      }) || [];

      const mentionMessages: Message[] = filteredMentions.map(mention => ({
        id: `mention-${mention.tweet_id}`,
        sender: 'mention' as const,
        timestamp: new Date(mention.created_at),
        tweetData: {
          id: mention.tweet_id,
          text: mention.tweet_text,
          author: `@${mention.author_username}`,
          authorImage: mention.author_profile_image_url,
          createdAt: mention.created_at,
          likes: mention.metrics?.likes || 0,
          retweets: mention.metrics?.retweets || 0,
          replies: mention.metrics?.replies || 0,
        },
        expandable: true,
        expanded: false,
      }));

      return mentionMessages;
    } catch (error) {
      console.error('Error fetching mentions:', error);
      return [];
    }
  };

  const fetchCoinRecommendations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('coin-recommendations', {
        body: {
          limit: 5,
          bypassFilters: true
        }
      });

      if (error) throw error;

      const recommendationMessages: Message[] = data?.recommendations?.map((rec: any) => {
        const coinData = {
          symbol: rec.symbol,
          name: rec.name,
          price: rec.price || 0,
          marketCap: rec.marketCap || 0,
          confidence: rec.confidence || 'medium',
          reason: rec.reason || 'High potential based on market analysis',
          logo: rec.logo,
          priceChange24h: rec.priceChange24h,
        };

        return {
          id: `rec-${Date.now()}-${rec.symbol}`,
          sender: 'recommendation' as const,
          timestamp: new Date(),
          coinRecommendations: [coinData],
        };
      }) || [];

      return recommendationMessages;
    } catch (error) {
      console.error('Error fetching coin recommendations:', error);
      return [];
    }
  };

  const startVoiceCall = async () => {
    console.log('🎯 startVoiceCall triggered!');
    try {
      if (!vapiRef.current) {
        const publicKey = '098bd142-677b-40a8-ab39-11792cb7737b';
        console.log('📝 Using hardcoded public key');
        
        console.log('🚀 Creating Vapi instance...');
        vapiRef.current = new Vapi(publicKey);
        
        console.log('✅ Vapi SDK initialized - audio will be handled automatically');
      }

      const vapi = vapiRef.current;

      vapi.on('call-start', () => {
        console.log('Call started successfully');
        setIsVoiceCallActive(true);
      });

      vapi.on('call-end', () => {
        console.log('Call ended');
        setIsVoiceCallActive(false);
        setCurrentCallId(null);
      });

      vapi.on('speech-start', () => {
        console.log('Assistant started speaking');
      });

      vapi.on('speech-end', () => {
        console.log('Assistant finished speaking');
      });

      vapi.on('message', (message: any) => {
        console.log('Vapi message:', message);
        
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

      console.log('📞 Starting Vapi call...');
      const call = await vapi.start({
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
              content: `You are ${agentName}, a DEGEN crypto trading assistant. You help users analyze cryptocurrency markets and Twitter signals. Keep responses short and to the point. Be enthusiastic about crypto opportunities.`,
            },
          ],
          temperature: 0.7,
        },
        voice: {
          provider: "openai",
          voiceId: "nova",
        },
        name: agentName,
        firstMessage: "What's up fellow DEGEN! I have gathered all of the latest tweets from the KOLs you follow. I will continue to analyze and will let you know if anything comes back. Check your phone for messages!",
        firstMessageMode: "assistant-speaks-first",
        clientMessages: ["transcript", "function-call", "hang", "speech-update", "conversation-update"],
      });

      if (call?.id) {
        setCurrentCallId(call.id);
      }

      const loadingMessage: Message = {
        id: Date.now().toString(),
        text: '🔄 Gathering latest tweets and analyzing coins...',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, loadingMessage]);

      const [tweetMessages, mentionMessages, recommendationMessages] = await Promise.all([
        fetchTweets(),
        fetchMentions(),
        fetchCoinRecommendations()
      ]);

      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

      if (tweetMessages.length > 0) {
        const tweetsHeader: Message = {
          id: 'tweets-header',
          text: `📱 Latest Tweets from Monitored Accounts (${tweetMessages.length})`,
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, tweetsHeader, ...tweetMessages]);
      }

      if (mentionMessages.length > 0) {
        const mentionsHeader: Message = {
          id: 'mentions-header',
          text: `💬 Recent Mentions (${mentionMessages.length})`,
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, mentionsHeader, ...mentionMessages]);
      }

      if (recommendationMessages.length > 0) {
        const recsHeader: Message = {
          id: 'recs-header',
          text: `🚀 Top 5 Coin Recommendations`,
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, recsHeader, ...recommendationMessages]);
      }

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

      setIsVoiceCallActive(false);
      setCurrentCallId(null);

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

  const toggleMessageExpansion = (messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, expanded: !msg.expanded };
      }
      return msg;
    }));
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

    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m monitoring the market for opportunities based on your configured filters. Click the green phone button to hear my latest analysis!',
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentResponse]);
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

  // Render message content helper
  const renderMessageContent = (message: Message) => {
    if (message.sender === 'tweet' && message.tweetData) {
      return (
        <Card className={cn(
          "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
          "transition-all duration-300",
          message.expanded ? "max-w-full" : "max-w-lg"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {message.tweetData.authorImage && (
                <img 
                  src={message.tweetData.authorImage} 
                  alt={message.tweetData.author}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{message.tweetData.author}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(message.tweetData.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMessageExpansion(message.id)}
                    className="h-6 w-6 p-0"
                  >
                    {message.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <p className={cn(
                  "text-sm text-gray-800 dark:text-gray-200",
                  !message.expanded && "line-clamp-3"
                )}>{message.tweetData.text}</p>
                {message.tweetData.likes !== undefined && (
                  <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>❤️ {message.tweetData.likes}</span>
                    <span>🔁 {message.tweetData.retweets || 0}</span>
                    <span>💬 {message.tweetData.replies || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (message.sender === 'mention' && message.tweetData) {
      return (
        <Card className={cn(
          "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
          "transition-all duration-300",
          message.expanded ? "max-w-full" : "max-w-lg"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded text-purple-900 dark:text-purple-100">Mention</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{message.tweetData.author}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(message.tweetData.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMessageExpansion(message.id)}
                    className="h-6 w-6 p-0"
                  >
                    {message.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <p className={cn(
                  "text-sm text-gray-800 dark:text-gray-200",
                  !message.expanded && "line-clamp-3"
                )}>{message.tweetData.text}</p>
                {message.tweetData.likes !== undefined && (
                  <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>❤️ {message.tweetData.likes}</span>
                    <span>🔁 {message.tweetData.retweets || 0}</span>
                    <span>💬 {message.tweetData.replies || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (message.sender === 'recommendation' && message.coinRecommendations) {
      return (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 space-y-3">
            {message.coinRecommendations.map((coin) => (
              <div 
                key={coin.symbol} 
                className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg p-3 transition-colors"
                onClick={() => onCoinSelect && onCoinSelect(coin)}
              >
                <div className="flex items-center gap-4">
                  {coin.logo && (
                    <img src={coin.logo} alt={coin.name} className="w-12 h-12 rounded-full" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{coin.symbol}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{coin.name}</span>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-semibold",
                        coin.confidence === 'high' && 'bg-green-500/20 text-green-800 dark:text-green-200',
                        coin.confidence === 'medium' && 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200',
                        coin.confidence === 'low' && 'bg-red-500/20 text-red-800 dark:text-red-200'
                      )}>
                        {coin.confidence} confidence
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="font-semibold ml-1 text-gray-900 dark:text-gray-100">${formatPrice(coin.price)}</span>
                        {coin.priceChange24h !== undefined && (
                          <span className={cn(
                            "ml-2 text-xs",
                            coin.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Market Cap:</span>
                        <span className="font-semibold ml-1 text-gray-900 dark:text-gray-100">{formatMarketCap(coin.marketCap)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">{coin.reason}</p>
                    {onCoinSelect && (
                      <div className="bg-stake-accent text-white text-center py-2 rounded-md font-medium text-sm">
                        📊 Click to View Live Chart
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    return (
      <div
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
              : 'bg-gray-800'
          )}
        >
          <p className="text-sm">{message.text}</p>
          <span className="text-xs opacity-60 mt-1 block">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  // Persistent view
  const persistentView = (
    <div className="h-full flex flex-col">
      <div className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{agentName} Trading Agent</h3>
          {twitterAccounts.length > 0 && (
            <span className="text-xs text-gray-500">({twitterAccounts.length} accounts)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showAgentMakeup ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAgentMakeup(!showAgentMakeup)}
            className="text-xs"
          >
            {showAgentMakeup ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            View Agent Makeup
          </Button>
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
              title="Start voice call - Fetches tweets and recommendations"
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-0 flex flex-col flex-1 overflow-hidden">
        {showAgentMakeup && (
          <div className="p-4 border-b bg-stake-darkbg">
            <NodeVisualizer agentId={agentId} />
          </div>
        )}
        
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {renderMessageContent(message)}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Monitored Accounts Section */}
        {twitterAccounts.length > 0 && (
          <div className="border-t border-gray-700">
            <div className="p-3 border-b border-gray-700 bg-stake-darkbg">
              <h4 className="text-sm font-semibold">Monitored Accounts</h4>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {twitterAccounts.map((token) => {
                const metadata = token.metadata as any;
                
                return (
                  <div key={token.address} className="p-2 border-b border-gray-700 hover:bg-stake-darkbg transition-colors">
                    <div className="flex items-center gap-2">
                      <img 
                        src={token.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.name}`} 
                        alt={token.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-xs truncate">
                            {metadata?.display_name || token.name}
                          </p>
                          {metadata?.verified && (
                            <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{token.name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
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
            
            <Button
              onClick={toggleListening}
              className={cn(
                "px-3",
                isListening && "bg-red-500 hover:bg-red-600"
              )}
              disabled={isVoiceCallActive}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          
          {isVoiceCallActive && (
            <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-600">
              🎙️ Voice call active - Speak naturally with your agent
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Floating chat view
  const floatingView = (
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
        <GlassCard className="fixed bottom-24 right-8 w-96 h-[600px] z-50 shadow-2xl animate-in slide-in-from-bottom-5" glow>
          <div className="flex flex-row items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{agentName} Trading Agent</h3>
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
          </div>
          
          <div className="p-0 flex flex-col h-[calc(100%-73px)]">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    {renderMessageContent(message)}
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
          </div>
        </GlassCard>
      )}
    </>
  );

  // Single return statement - no conditional returns
  return isPersistent ? persistentView : floatingView;
};

export default AgentChat;
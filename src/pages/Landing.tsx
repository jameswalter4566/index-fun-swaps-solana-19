import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Mic, MessageCircle, Search, BarChart3, Trophy, Wallet, Phone, Monitor, Send, X, ChevronRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import NodeVisualizer from '@/components/NodeVisualizer';
import Vapi from '@vapi-ai/web';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Landing = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [isVapiListening, setIsVapiListening] = useState(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [orbFillPercentage, setOrbFillPercentage] = useState(0);
  const [textHighlightPercentage, setTextHighlightPercentage] = useState(0);
  const orbRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const vapiRef = useRef<any>(null);
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [currentAssistantTranscript, setCurrentAssistantTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Hardcoded mock data
  const mockChartData = {
    "oclhv": [
      { "open": 0.000004854431116746769, "close": 0.00003899970329722762, "low": 0.000004854431116746769, "high": 0.00003899970329722762, "volume": 9555.164365922716, "time": 1748319660 },
      { "open": 0.00003899970329722762, "close": 0.000040070822644761225, "low": 0.00003801216901977105, "high": 0.000040070822644761225, "volume": 3132.175725172424, "time": 1748319720 },
      { "open": 0.000040070822644761225, "close": 0.00007108755310689704, "low": 0.00003800997420330293, "high": 0.00007108755310689704, "volume": 5413.937615739946, "time": 1748319780 },
      { "open": 0.00007108755310689704, "close": 0.0000874378922010721, "low": 0.00007108755310689704, "high": 0.0000874378922010721, "volume": 5068.496358666287, "time": 1748319840 },
      { "open": 0.0000874378922010721, "close": 0.00009339696251221232, "low": 0.00008267299549052405, "high": 0.00009339696251221232, "volume": 5263.2647625796135, "time": 1748319900 },
      { "open": 0.00009339696251221232, "close": 0.00009577971216691349, "low": 0.0000873608306097982, "high": 0.00009577971216691349, "volume": 3232.6038956580696, "time": 1748319960 },
      { "open": 0.00009577971216691349, "close": 0.00009839852333016925, "low": 0.0000926966910050848, "high": 0.00009839852333016925, "volume": 8103.056198750356, "time": 1748320020 },
      { "open": 0.00009839852333016925, "close": 0.00008609296076524529, "low": 0.00008609296076524529, "high": 0.00009839852333016925, "volume": 5683.701145249119, "time": 1748320080 },
      { "open": 0.00008609296076524529, "close": 0.00008723248839936553, "low": 0.00008386812723838779, "high": 0.00008723248839936553, "volume": 1420.5830535598366, "time": 1748320140 },
      { "open": 0.00008723248839936553, "close": 0.00008812469858190626, "low": 0.0000870263537378095, "high": 0.00008812469858190626, "volume": 263.1894310923997, "time": 1748320200 },
      { "open": 0.00008812469858190626, "close": 0.00008743617921103195, "low": 0.0000874361667271997, "high": 0.00008812469858190626, "volume": 3764.5522010234845, "time": 1748320260 },
      { "open": 0.00008743617921103195, "close": 0.00008907190643707422, "low": 0.0000865119339477863, "high": 0.00008907190643707422, "volume": 4119.362855715291, "time": 1748320320 },
      { "open": 0.00008907190643707422, "close": 0.00008955599080431769, "low": 0.00008854225567123346, "high": 0.00008955599080431769, "volume": 3339.4075637803544, "time": 1748320380 },
      { "open": 0.00008955599080431769, "close": 0.00009827732581929371, "low": 0.0000895532239151267, "high": 0.00009827732581929371, "volume": 5001.963993623193, "time": 1748320440 },
      { "open": 0.00009827732581929371, "close": 0.00009909817067511757, "low": 0.00009762014585244879, "high": 0.00009909817067511757, "volume": 8891.849084545584, "time": 1748320500 },
      { "open": 0.00009909817067511757, "close": 0.00009882169448932199, "low": 0.00009735444460895815, "high": 0.00009909817067511757, "volume": 7401.051331153967, "time": 1748320560 },
      { "open": 0.00009882169448932199, "close": 0.0000996872573904796, "low": 0.00009882169448932199, "high": 0.0000996872573904796, "volume": 9912.91990043622, "time": 1748320620 },
      { "open": 0.0000996872573904796, "close": 0.00009737579842919403, "low": 0.0000968687150216734, "high": 0.0000996872573904796, "volume": 6056.988570679215, "time": 1748320680 },
      { "open": 0.00009737579842919403, "close": 0.00010758525550829115, "low": 0.00009737579842919403, "high": 0.00010758525550829115, "volume": 3728.1319893951245, "time": 1748320740 },
      { "open": 0.00010758525550829115, "close": 0.00011472355113010295, "low": 0.00010758525550829115, "high": 0.00011472355113010295, "volume": 4225.371288485006, "time": 1748320800 },
      { "open": 0.00011472355113010295, "close": 0.00008746506457155095, "low": 0.00008647615291630717, "high": 0.00011472355113010295, "volume": 6213.271440532544, "time": 1748320860 },
      { "open": 0.00008746506457155095, "close": 0.00009117818938954124, "low": 0.00008692569502592593, "high": 0.00009117818938954124, "volume": 3688.266407321621, "time": 1748320920 },
      { "open": 0.00009117818938954124, "close": 0.00008928981765203288, "low": 0.00008207477033806699, "high": 0.00009401052399712655, "volume": 7070.792627111538, "time": 1748320980 },
      { "open": 0.00008928981765203288, "close": 0.00009131220975481032, "low": 0.0000885252543749757, "high": 0.00009161705876029676, "volume": 6232.830248908196, "time": 1748321040 },
      { "open": 0.00009131220975481032, "close": 0.00009317647328417604, "low": 0.00009131220975481032, "high": 0.00009317647328417604, "volume": 1929.3487172020052, "time": 1748321100 },
      { "open": 0.00009317647328417604, "close": 0.00009354839890881808, "low": 0.00009308818569119109, "high": 0.00009354839890881808, "volume": 8601.718024128006, "time": 1748321160 },
      { "open": 0.00009354839890881808, "close": 0.00009474529083344235, "low": 0.00009354839890881808, "high": 0.00009474529083344235, "volume": 8601.718024128006, "time": 1748321220 }
    ],
    "stats": {
      "totalVolume": 145915.7168205601,
      "priceRange": { "min": 0.000004854431116746769, "max": 0.00011472355113010295 },
      "candleCount": 27,
      "timeframe": "1m"
    }
  };

  const mockTopTraders = [
    { "rank": 1, "wallet": "CNdfoojU91E23xkLNmyrWKsa5CoxjWouGfJZYyrEjBio", "held": 773112127.6569841, "sold": 41852286, "holding": 3232357.726984, "realizedPnL": 1072.433873473898, "unrealizedPnL": 247.18385908987995, "totalPnL": 1319.617732563778, "totalInvested": 13934.707945255643, "roi": "-90.53", "status": "holding" },
    { "rank": 2, "wallet": "A5p2oSJgjkE97wC1Va3B2H3J2T9nkndVBm72E975w2X8", "held": 9355036.52, "sold": 9355036.52, "holding": 1108319.024113, "realizedPnL": 1012.4409592763801, "unrealizedPnL": 4.079076518513091, "totalPnL": 1016.5200357948931, "totalInvested": 100.92893175744226, "roi": "907.16", "status": "holding" },
    { "rank": 3, "wallet": "o8trzFarepqgFyXKuaYEWtR5SjsVtveeCtjrbDmrVVc", "held": 10401323.473999001, "sold": 10401323.473999001, "holding": 2179625.46243, "realizedPnL": 996.0815026712864, "unrealizedPnL": -19.011063537507255, "totalPnL": 977.0704391337792, "totalInvested": 296.1546340436304, "roi": "229.92", "status": "holding" },
    { "rank": 4, "wallet": "5VpKeDCGkiybwsbjbWdRCkNsjyj11F5TqHVbgL7e6Qbb", "held": 9383112.88, "sold": 9383112.88, "holding": 1653637.106092, "realizedPnL": 961.3731098627026, "unrealizedPnL": 0.660774596393765, "totalPnL": 962.0338844590963, "totalInvested": 156.01355395248237, "roi": "516.63", "status": "holding" },
    { "rank": 5, "wallet": "eCw4wyBMQx434DmSRTzuRTmGwZZkx198JFn7cUJN51G", "held": 9782067.214943, "sold": 9782067.214943, "holding": 3519587.943513, "realizedPnL": 961.7255484811103, "unrealizedPnL": -17.400110709839964, "totalPnL": 944.3254377712703, "totalInvested": 383.8784570479207, "roi": "146.00", "status": "holding" }
  ];

  const mockTokenHolders = {
    "totalHolders": 3604,
    "topHolders": [
      { "rank": 1, "wallet": "2k7MKz7MjhoPKYGxFWZxh7t7bztL8UqFxBvgQk1R5cYV", "amount": 181841966.372541, "valueUSD": 17228.66998969144, "percentage": 18.184196637254104, "isWhale": true, "isTop10": true },
      { "rank": 2, "wallet": "36zF6irPPRjbHrPR5Bz5tpT4LRzoR4JbXS45xQVhZfMq", "amount": 11454112.777839, "valueUSD": 1085.2232463754042, "percentage": 1.1454112777838998, "isWhale": true, "isTop10": true },
      { "rank": 3, "wallet": "78b2NKEr1AW5vSNBesxcidmsZxy7WDchvQjynzvz1opU", "amount": 11297666.386932, "valueUSD": 1070.4006875690782, "percentage": 1.1297666386932, "isWhale": true, "isTop10": true },
      { "rank": 4, "wallet": "BpVm1LfQSretTHJmSDRjpXT5QpJcgJb74eGQuegMKqmR", "amount": 11110007.745239, "valueUSD": 1052.6209149844663, "percentage": 1.1110007745239001, "isWhale": true, "isTop10": true },
      { "rank": 5, "wallet": "EmgwtJCtU7G2azU4mRPTCmaZxuco3N3DNW6KvDqmZyHu", "amount": 10894348.975487, "valueUSD": 1032.1882621235304, "percentage": 1.0894348975487, "isWhale": true, "isTop10": true }
    ]
  };

  const mockTokenStats = {
    "price": 0.00009474529083344235,
    "priceChange24h": 1849.32,
    "volume24h": 145915.72,
    "liquidity": 1234567.89,
    "marketCap": 9474529.08,
    "holders": 3604,
    "fdv": 94745290.83
  };

  const mockCoin = {
    name: "AI Agent X",
    symbol: "$AGENTX",
    address: "DemoTokenAddressForLandingPage123",
    imageUrl: "/placeholder.svg",
    price: 0.00009474529083344235,
    marketCap: 9474529.08,
    volume24h: 145915.72
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      sectionsRef.current.forEach((section, index) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
            setCurrentSection(index);
          }
        }
      });

      // Calculate scroll progress for section 3 animations (orb section)
      if (sectionsRef.current[2]) {
        const section3 = sectionsRef.current[2];
        const rect = section3.getBoundingClientRect();
        const sectionTop = section3.offsetTop;
        const sectionHeight = section3.offsetHeight;
        
        // Calculate how much of section 3 is in view
        if (scrollPosition >= sectionTop - windowHeight && scrollPosition <= sectionTop + sectionHeight) {
          const progress = Math.max(0, Math.min(1, 
            (scrollPosition - (sectionTop - windowHeight)) / (windowHeight + sectionHeight)
          ));
          
          setScrollProgress(progress);
          
          // Update orb fill (0-100%)
          setOrbFillPercentage(progress * 100);
          
          // Update text highlight (0-100%)
          setTextHighlightPercentage(progress * 100);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, currentUserTranscript, currentAssistantTranscript]);

  const handleStartChat = async () => {
    if (isVoiceCallActive) {
      // End the call
      if (vapiRef.current) {
        vapiRef.current.stop();
        setIsVoiceCallActive(false);
        toast.info("Call ended");
      }
      return;
    }

    try {
      if (!vapiRef.current) {
        const publicKey = '098bd142-677b-40a8-ab39-11792cb7737b';
        console.log('🚀 Creating Vapi instance...');
        vapiRef.current = new Vapi(publicKey);
        console.log('✅ Vapi SDK initialized');
      }

      const vapi = vapiRef.current;

      vapi.on('call-start', () => {
        console.log('Call started successfully');
        setIsVoiceCallActive(true);
        toast.success('Connected to AI Trading Agent! Speak now...');
      });

      vapi.on('call-end', () => {
        console.log('Call ended');
        setIsVoiceCallActive(false);
        // Save any pending transcripts to chat history
        if (currentUserTranscript.trim()) {
          setChatHistory(prev => [...prev, { role: 'user', text: currentUserTranscript.trim() }]);
          setCurrentUserTranscript('');
        }
        if (currentAssistantTranscript.trim()) {
          setChatHistory(prev => [...prev, { role: 'assistant', text: currentAssistantTranscript.trim() }]);
          setCurrentAssistantTranscript('');
        }
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
          if (message.role === 'user' && message.transcript) {
            // Handle user transcript
            if (message.transcriptType === 'final') {
              // Final transcript - add to chat history and clear current
              const fullText = currentUserTranscript + ' ' + message.transcript;
              setChatHistory(prev => [...prev, { role: 'user', text: fullText.trim() }]);
              setCurrentUserTranscript('');
            } else {
              // Partial transcript - update current
              setCurrentUserTranscript(prev => prev + ' ' + message.transcript);
            }
          } else if (message.role === 'assistant' && message.transcript) {
            // Handle assistant transcript
            if (message.transcriptType === 'final') {
              // Final transcript - add to chat history and clear current
              const fullText = currentAssistantTranscript + ' ' + message.transcript;
              setChatHistory(prev => [...prev, { role: 'assistant', text: fullText.trim() }]);
              setCurrentAssistantTranscript('');
            } else {
              // Partial transcript - update current
              setCurrentAssistantTranscript(prev => prev + ' ' + message.transcript);
            }
          }
        }
      });

      vapi.on('error', (error: any) => {
        console.error('Vapi error:', error);
        toast.error(error.message || 'An error occurred during the voice call');
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
              content: "You are a DEGEN crypto trading assistant. You help users analyze cryptocurrency markets. Keep responses short and enthusiastic about crypto opportunities.",
            },
          ],
          temperature: 0.7,
        },
        voice: {
          provider: "openai",
          voiceId: "nova",
        },
        name: "AI Trading Agent",
        firstMessage: "Hey! I'm your AI trading agent. I can help you analyze crypto markets and find the best opportunities. What are you looking for today?",
        firstMessageMode: "assistant-speaks-first",
      });

    } catch (error) {
      console.error('Error starting voice call:', error);
      toast.error('Failed to start voice call. Please check your microphone permissions.');
    }
  };

  const handleVapiClick = async () => {
    setIsVapiListening(true);
    
    try {
      // Initialize Vapi if not already done
      if (!window.vapi) {
        const { default: Vapi } = await import('@vapi-ai/web');
        window.vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);
      }

      // Start the call
      await window.vapi.start({
        assistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID,
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          systemPrompt: "You are a helpful AI trading assistant. Keep responses brief and focused on crypto trading.",
        }
      });

      // Listen for call end
      window.vapi.on('call-end', () => {
        setIsVapiListening(false);
        toast.success("Call ended");
      });

    } catch (error) {
      console.error('Vapi error:', error);
      toast.error("Failed to start voice chat");
      setIsVapiListening(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-purple-500">in-dex.fun</h2>
            </div>
            
            <nav className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/create-swap')}
                className="glass-button"
              >
                Create Agent
              </button>
              
              <button
                onClick={() => navigate('/index')}
                className="glass-button"
              >
                Explore Agents
              </button>
              
              <button
                onClick={() => navigate('/index')}
                className="glass-button"
              >
                Trade
              </button>
              
              <button
                onClick={() => navigate('/documentation')}
                className="glass-button"
              >
                Documentation
              </button>
              
              <a
                href="https://x.com/index_fun"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button inline-block"
              >
                Twitter
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Section 1: Hero */}
      <section 
        ref={el => sectionsRef.current[0] = el}
        className="h-screen flex flex-col items-center justify-center relative pt-16"
        style={{
          opacity: currentSection === 0 ? 1 : 0,
          transform: currentSection === 0 ? 'translateY(0)' : 'translateY(100px)',
          transition: 'all 0.8s ease-in-out'
        }}
      >
        <h1 className="text-6xl md:text-8xl font-bold mb-8 text-center animate-fade-in">
          AI Trading Agents are here
        </h1>
        
        <div className="flex flex-col items-center gap-8 mb-16">
          <button
            onClick={() => navigate('/index')}
            className="glass-button-large animate-pulse-glow"
          >
            Create Your Agent Now
          </button>
          
          <button
            onClick={handleStartChat}
            className={`glass-button-large flex items-center gap-3 ${isVoiceCallActive ? 'ring-2 ring-red-500' : 'ring-2 ring-green-500'}`}
          >
            <MessageCircle className={`w-6 h-6 ${isVoiceCallActive ? 'animate-pulse' : ''}`} />
            {isVoiceCallActive ? 'End Voice Chat' : 'Start Chatting with Agent'}
          </button>
        </div>

        {/* Mini Index Page Recreation */}
        <div className="w-full max-w-6xl mx-auto px-4">
          <GlassCard glow className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{mockCoin.name}</h3>
                    <p className="text-purple-400">{mockCoin.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono">${mockCoin.price.toFixed(8)}</p>
                    <p className="text-green-400">+1849.32%</p>
                  </div>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={mockChartData.oclhv.map((candle: any) => ({
                        time: candle.time * 1000,
                        price: candle.close,
                        high: candle.high,
                        low: candle.low,
                        displayTime: format(new Date(candle.time * 1000), 'HH:mm')
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="displayTime" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        hide
                        domain={['dataMin * 0.95', 'dataMax * 1.05']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid #8b5cf6',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#8b5cf6' }}
                        formatter={(value: any) => `$${Number(value).toFixed(8)}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#priceGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Token Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="p-4">
                    <p className="text-sm text-gray-400">Market Cap</p>
                    <p className="text-xl font-mono">${(mockTokenStats.marketCap / 1000000).toFixed(2)}M</p>
                  </GlassCard>
                  <GlassCard className="p-4">
                    <p className="text-sm text-gray-400">24h Volume</p>
                    <p className="text-xl font-mono">${(mockTokenStats.volume24h / 1000).toFixed(2)}K</p>
                  </GlassCard>
                  <GlassCard className="p-4">
                    <p className="text-sm text-gray-400">Holders</p>
                    <p className="text-xl font-mono">{mockTokenStats.holders.toLocaleString()}</p>
                  </GlassCard>
                  <GlassCard className="p-4">
                    <p className="text-sm text-gray-400">Liquidity</p>
                    <p className="text-xl font-mono">${(mockTokenStats.liquidity / 1000000).toFixed(2)}M</p>
                  </GlassCard>
                </div>
              </div>

              {/* Top Traders & Holders */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Top Traders</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {mockTopTraders.slice(0, 5).map((trader) => (
                      <GlassCard key={trader.wallet} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-mono">{trader.wallet.slice(0, 8)}...{trader.wallet.slice(-6)}</p>
                            <p className="text-xs text-gray-400">Rank #{trader.rank}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${trader.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${trader.totalPnL.toFixed(2)}
                            </p>
                            <p className={`text-xs ${parseFloat(trader.roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trader.roi}%
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Top Holders</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {mockTokenHolders.topHolders.slice(0, 5).map((holder) => (
                      <GlassCard key={holder.wallet} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-mono">{holder.wallet.slice(0, 8)}...{holder.wallet.slice(-6)}</p>
                            <p className="text-xs text-gray-400">{holder.percentage.toFixed(2)}% of supply</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">${(holder.valueUSD / 1000).toFixed(2)}K</p>
                            {holder.isWhale && <span className="text-xs text-yellow-400">🐋 Whale</span>}
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Section 2: Platform Features */}
      <section 
        ref={el => sectionsRef.current[1] = el}
        className="min-h-screen py-20 relative"
      >
        <div className="container mx-auto px-4">
          {/* First Explainer Segment - Create Agent */}
          <div className="max-w-6xl mx-auto mb-32 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Replica of Create Agent Form - Left Side */}
              <div className="order-2 lg:order-1 transform scale-90">
                <GlassCard className="max-w-md mx-auto">
                  <div className="p-6 space-y-6">
                    <h2 className="text-2xl font-bold mb-4">Create New Trading Agent</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Agent Name</Label>
                        <Input placeholder="My Trading Bot" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Input placeholder="A smart agent that monitors crypto markets" className="mt-1" />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Monitor Twitter Accounts (KOLs)</Label>
                        <div className="flex gap-2">
                          <Input placeholder="@cryptowhale" className="flex-1" />
                          <Button size="sm">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">@elonmusk</Badge>
                          <Badge variant="secondary">@VitalikButerin</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min Market Cap</Label>
                          <Input placeholder="$100K" />
                        </div>
                        <div>
                          <Label>Max Market Cap</Label>
                          <Input placeholder="$10M" />
                        </div>
                      </div>
                      
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Deploy Agent
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </div>
              
              {/* Explainer Text - Right Side */}
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-3xl font-bold">Turn your favorite KOLs into your personal trading assistant</h3>
                <p className="text-xl text-gray-300">
                  Trade and communicate with your agent directly from our platform. Set your parameters, choose your influencers, and let AI do the heavy lifting.
                </p>
                <Button 
                  onClick={() => navigate('/create-swap')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create Your Agent <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Second Explainer Segment - Trading Agent Chat */}
          <div className="max-w-6xl mx-auto mb-32 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Explainer Text - Left Side */}
              <div className="space-y-4">
                <h3 className="text-3xl font-bold">AI Voice Personality Based on Your KOLs</h3>
                <p className="text-xl text-gray-300">
                  Our Twitter integration utilizes advanced AI modeling to mimic the personality of the KOLs that you monitor, creating a Custom AI voice personality based on your preferred KOLs!
                </p>
                <Button 
                  onClick={() => navigate('/index')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Try Voice Chat <Phone className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {/* Replica of Agent Chat - Right Side */}
              <div className="transform scale-90">
                <GlassCard className="max-w-md mx-auto">
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-2">Trading Agent Chat</h3>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Start Call
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                        >
                          <Monitor className="mr-2 h-4 w-4" />
                          Screen Share
                        </Button>
                      </div>
                    </div>
                    
                    {/* Chat Window */}
                    <div className="bg-black/50 rounded-lg p-4 h-64 mb-4 overflow-y-auto">
                      <div className="space-y-3">
                        <div className="flex justify-start">
                          <div className="bg-gray-700 rounded-lg px-4 py-2 max-w-[80%]">
                            <p className="text-sm">Hey! I've found some interesting opportunities based on your KOLs' activity.</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-blue-600 rounded-lg px-4 py-2 max-w-[80%]">
                            <p className="text-sm">What are the top picks?</p>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-gray-700 rounded-lg px-4 py-2 max-w-[80%]">
                            <p className="text-sm">$PEPE is getting massive attention. Elon just tweeted about meme coins!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Monitored Accounts */}
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-sm font-semibold mb-2">Monitored Accounts</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge>@elonmusk</Badge>
                        <Badge>@VitalikButerin</Badge>
                        <Badge>@CZ_Binance</Badge>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>

          {/* Third Explainer Segment - Live Chart */}
          <div className="max-w-6xl mx-auto animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Replica of Live Chart - Left Side */}
              <div className="order-2 lg:order-1 transform scale-90">
                <GlassCard className="flex-1">
                  <div className="p-6">
                    <div className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          placeholder="Enter token address..."
                          className="flex-1 border-purple-500/50 focus:border-purple-500"
                        />
                        <Button className="bg-purple-600 hover:bg-purple-700" size="icon">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="h-[400px] flex items-center justify-center text-gray-400 bg-black/50 rounded-lg">
                      <div className="text-center px-8">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50 text-purple-500" />
                        <p className="text-lg font-medium mb-2">Chart Will Display Here!</p>
                        <p className="text-sm text-gray-500">Search coin now or click a recommendation from the AI agent!</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Tabs defaultValue="traders" className="w-full">
                        <TabsList className="w-full justify-start bg-gray-800 border border-gray-700 rounded-full p-1">
                          <TabsTrigger value="traders" className="rounded-full data-[state=active]:bg-purple-600">
                            <Trophy className="h-4 w-4 mr-2" />
                            Top Traders
                          </TabsTrigger>
                          <TabsTrigger value="holders" className="rounded-full data-[state=active]:bg-purple-600">
                            <Wallet className="h-4 w-4 mr-2" />
                            Holders
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="traders" className="mt-4">
                          <div className="text-center py-8">
                            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20 text-purple-500" />
                            <p className="text-gray-400">Our AI will populate this with trader information</p>
                          </div>
                        </TabsContent>
                        <TabsContent value="holders" className="mt-4">
                          <div className="text-center py-8">
                            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20 text-purple-500" />
                            <p className="text-gray-400">Holder data will appear here</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </GlassCard>
              </div>
              
              {/* Explainer Text - Right Side */}
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-3xl font-bold">AI-Powered Coin Recommendations</h3>
                <p className="text-xl text-gray-300">
                  Our agent will constantly recommend new coins to you based on the parameters you set at the beginning, then you can trade live!
                </p>
                <Button 
                  onClick={() => navigate('/index')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Start Trading <BarChart3 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Orb and Text Animation (Previously Section 2) */}
      <section 
        ref={el => sectionsRef.current[2] = el}
        className="h-screen flex items-center justify-center relative"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Orb Animation */}
            <div className="flex justify-center lg:justify-end">
              <div 
                ref={orbRef}
                className="relative w-80 h-80 rounded-full bg-gray-900/50 backdrop-blur-sm border border-purple-500/20 overflow-hidden"
              >
                {/* Purple fill that animates with scroll */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-100 ease-out"
                  style={{
                    height: `${orbFillPercentage}%`,
                  }}
                >
                  {/* Animated waves on top of the fill */}
                  <div className="absolute top-0 left-0 right-0 h-8">
                    <svg className="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path 
                        d="M0,5 Q25,0 50,5 T100,5 L100,10 L0,10 Z" 
                        fill="rgba(147, 51, 234, 0.3)"
                        className="animate-pulse"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-purple-400/20 blur-xl" />
                
                {/* Inner orb content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white/80 mb-2">
                      {Math.round(orbFillPercentage)}%
                    </div>
                    <div className="text-sm text-purple-300">Agent Power</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Text with Highlight Animation */}
            <div className="lg:pl-8">
              <div 
                ref={textRef}
                className="relative text-3xl md:text-4xl font-bold text-white leading-relaxed"
              >
                {/* Background text */}
                <span className="relative z-10">
                  Create and deploy your own AI agent! Simply click the create new agent button then add up to 4 KOL accounts and all of your preferred coin parameters for your AI agent to constantly be on the lookout for.
                </span>
                
                {/* Highlight overlay */}
                <span 
                  className="absolute top-0 left-0 text-transparent bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text z-20 overflow-hidden whitespace-pre-wrap"
                  style={{
                    clipPath: `polygon(0 0, ${textHighlightPercentage}% 0, ${textHighlightPercentage}% 100%, 0 100%)`,
                  }}
                >
                  Create and deploy your own AI agent! Simply click the create new agent button then add up to 4 KOL accounts and all of your preferred coin parameters for your AI agent to constantly be on the lookout for.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Node Editor (Previously Section 3) */}
      <section 
        ref={el => sectionsRef.current[3] = el}
        className="min-h-screen flex flex-col items-center justify-center relative py-20"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Explore Agent Architecture</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              View other agents that creators have made on the platform and copy their genetic makeup instantly!
            </p>
          </div>
          
          {/* Node Editor Container */}
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 max-w-6xl mx-auto">
            <div className="h-[600px] relative">
              <NodeVisualizer 
                nodeTypeFilter={[]}
                minConfidence={0}
                showNodeVisualizer={true}
                autoMode={false}
                searchQuery=""
              />
            </div>
            
            {/* Instructions */}
            <div className="mt-6 text-center text-gray-400">
              <p className="text-sm">Drag nodes around to explore the agent architecture</p>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Chat Window */}
      {isVoiceCallActive && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] z-50">
          <GlassCard className="h-full flex flex-col p-0 overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Trading Agent</h3>
                <button
                  onClick={() => {
                    if (vapiRef.current) {
                      vapiRef.current.stop();
                      setIsVoiceCallActive(false);
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">Voice chat active</p>
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {/* Chat History */}
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-700 text-white rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}

              {/* Current User Transcript */}
              {currentUserTranscript.trim() && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-blue-600 text-white rounded-br-sm opacity-70">
                    <p className="text-sm">{currentUserTranscript.trim()}</p>
                  </div>
                </div>
              )}

              {/* Current Assistant Transcript */}
              {currentAssistantTranscript.trim() && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-gray-700 text-white rounded-bl-sm opacity-70">
                    <p className="text-sm">{currentAssistantTranscript.trim()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Footer */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="animate-pulse flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Listening...</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Landing;
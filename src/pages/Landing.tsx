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
import GuardianCard from '@/components/GuardianCard';

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
  const [featuredGuardians, setFeaturedGuardians] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);


  // Fetch featured guardians
  useEffect(() => {
    const fetchFeaturedGuardians = async () => {
      try {
        const { data, error } = await supabase
          .from('indexes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;
        setFeaturedGuardians(data || []);
      } catch (error) {
        console.error('Error fetching featured guardians:', error);
      }
    };

    fetchFeaturedGuardians();
  }, []);

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
        toast.success('Connected to AI Trading Guardian! Speak now...');
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
        name: "AI Trading Guardian",
        firstMessage: "Hey! I'm your AI trading guardian. I can help you analyze crypto markets and find the best opportunities. What are you looking for today?",
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
          <div className="flex items-center justify-center h-16">
            <a 
              href="https://x.com/guardiandotcash" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <svg 
                className="w-6 h-6 text-white" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Section 1: Hero */}
      <section 
        ref={el => sectionsRef.current[0] = el}
        className="min-h-screen flex flex-col items-center justify-center relative py-20 px-4 overflow-hidden"
        style={{
          opacity: currentSection === 0 ? 1 : 0,
          transform: currentSection === 0 ? 'translateY(0)' : 'translateY(100px)',
          transition: 'all 0.8s ease-in-out'
        }}
      >
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8 md:mb-12 animate-fade-in">
          <img 
            src="/GUARDIANLOGO.jpg" 
            alt="Guardian Logo" 
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 rounded-full mb-4 md:mb-6 shadow-2xl animate-pulse-glow"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-2 text-center text-white">
            guardian
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white lowercase">
            create ai trading assistants modeled off your trusted kols - then speak to them.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8 md:mb-16">
          <button
            onClick={() => navigate('/guardian')}
            className="glass-button-large animate-pulse-glow text-sm sm:text-base"
          >
            Create Your Guardian Now
          </button>
          
          <button
            onClick={handleStartChat}
            className={`glass-button-large flex items-center gap-3 ${isVoiceCallActive ? 'ring-2 ring-red-500' : 'ring-2 ring-green-500'} text-sm sm:text-base`}
          >
            <MessageCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${isVoiceCallActive ? 'animate-pulse' : ''}`} />
            {isVoiceCallActive ? 'End Voice Chat' : 'Test Guardian Voice Chat'}
          </button>
        </div>

        {/* Featured Guardians */}
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 md:mb-8">Featured Guardians</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredGuardians.length > 0 ? (
              featuredGuardians.map((guardian) => (
                <GuardianCard
                  key={guardian.id}
                  id={guardian.id}
                  name={guardian.name}
                  tokens={guardian.tokens}
                  gainPercentage={0}
                  upvotes={0}
                />
              ))
            ) : (
              // Mock Guardian Cards if no data
              Array.from({ length: 4 }).map((_, i) => (
                <GuardianCard
                  key={`mock-${i}`}
                  id={`mock-${i}`}
                  name="Loading..."
                  tokens={[]}
                  gainPercentage={0}
                  upvotes={0}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Platform Features */}
      <section 
        ref={el => sectionsRef.current[1] = el}
        className="min-h-screen py-20 relative"
      >
        <div className="container mx-auto px-4">
          {/* First Explainer Segment - Create Guardian */}
          <div className="max-w-6xl mx-auto mb-32 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Replica of Create Guardian Form - Left Side */}
              <div className="order-2 lg:order-1 transform scale-90">
                <GlassCard className="max-w-md mx-auto">
                  <div className="p-6 space-y-6">
                    <h2 className="text-2xl font-bold mb-4">Create New Trading Guardian</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Guardian Name</Label>
                        <Input placeholder="My Trading Guardian" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Input placeholder="A smart guardian that monitors crypto markets" className="mt-1" />
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
                        Deploy Guardian
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </div>
              
              {/* Explainer Text - Right Side */}
              <div className="order-1 lg:order-2 space-y-4">
                <h3 className="text-3xl font-bold">Turn your favorite KOLs into your personal trading assistant</h3>
                <p className="text-xl text-gray-300">
                  Trade and communicate with your guardian directly from our platform. Set your parameters, choose your influencers, and let AI do the heavy lifting.
                </p>
                <Button 
                  onClick={() => navigate('/create-swap')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create Your Guardian <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Second Explainer Segment - Trading Guardian Chat */}
          <div className="max-w-6xl mx-auto mb-32 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Explainer Text - Left Side */}
              <div className="space-y-4">
                <h3 className="text-3xl font-bold">AI Voice Personality Based on Your KOLs</h3>
                <p className="text-xl text-gray-300">
                  Our Twitter integration utilizes advanced AI modeling to mimic the personality of the KOLs that you monitor, creating a Custom AI voice personality based on your preferred KOLs!
                </p>
                <Button 
                  onClick={() => navigate('/guardian')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Try Voice Chat <Phone className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {/* Replica of Guardian Chat - Right Side */}
              <div className="transform scale-90">
                <GlassCard className="max-w-md mx-auto">
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-2">Trading Guardian Chat</h3>
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
                        <p className="text-sm text-gray-500">Search coin now or click a recommendation from the AI guardian!</p>
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
                  Our guardian will constantly recommend new coins to you based on the parameters you set at the beginning, then you can trade live!
                </p>
                <Button 
                  onClick={() => navigate('/guardian')}
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
                    <div className="text-sm text-purple-300">Guardian Power</div>
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
                  Create and deploy your own AI guardian! Simply click the create new guardian button then add up to 4 KOL accounts and all of your preferred coin parameters for your AI guardian to constantly be on the lookout for.
                </span>
                
                {/* Highlight overlay */}
                <span 
                  className="absolute top-0 left-0 text-transparent bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text z-20 overflow-hidden whitespace-pre-wrap"
                  style={{
                    clipPath: `polygon(0 0, ${textHighlightPercentage}% 0, ${textHighlightPercentage}% 100%, 0 100%)`,
                  }}
                >
                  Create and deploy your own AI guardian! Simply click the create new guardian button then add up to 4 KOL accounts and all of your preferred coin parameters for your AI guardian to constantly be on the lookout for.
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Explore Guardian Architecture</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              View other guardians that creators have made on the platform and copy their genetic makeup instantly!
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
              <p className="text-sm">Drag nodes around to explore the guardian architecture</p>
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
                <h3 className="text-lg font-semibold">AI Trading Guardian</h3>
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
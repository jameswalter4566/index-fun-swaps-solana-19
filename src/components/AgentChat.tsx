import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface AgentChatProps {
  agentName: string;
  agentId: string;
}

const AgentChat: React.FC<AgentChatProps> = ({ agentName, agentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording logic here
      console.log('Starting voice recording...');
    } else {
      // Stop recording and process
      console.log('Stopping voice recording...');
      // Simulate voice input
      setTimeout(() => {
        handleSendMessage('Show me the top trending coins from the monitored accounts');
      }, 500);
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

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Based on the Twitter accounts I\'m monitoring and current market conditions, here are my recommendations:',
        sender: 'agent',
        timestamp: new Date(),
        coinRecommendations: [
          {
            symbol: 'PEPE',
            name: 'Pepe',
            price: 0.00000123,
            marketCap: 500000,
            confidence: 'high',
            reason: '3 monitored accounts mentioned PEPE with bullish sentiment. Volume up 150% in last hour.',
          },
          {
            symbol: 'WOJAK',
            name: 'Wojak',
            price: 0.00000456,
            marketCap: 250000,
            confidence: 'medium',
            reason: 'Trending on 2 monitored accounts. Early stage with growing community.',
          },
          {
            symbol: 'DOGE2',
            name: 'Doge 2.0',
            price: 0.00000789,
            marketCap: 150000,
            confidence: 'low',
            reason: 'Mentioned by 1 account. High risk but potential for quick gains.',
          },
        ],
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

  return (
    <>
      {/* Microphone Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-16 h-16 rounded-full shadow-lg transition-all",
            "bg-stake-accent hover:bg-stake-highlight",
            "flex items-center justify-center",
            isRecording && "animate-pulse"
          )}
        >
          <Mic className="w-6 h-6" />
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-stake-accent animate-ping" />
          )}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
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
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                size="icon"
                onClick={handleToggleRecording}
                className="shrink-0"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about trading opportunities..."
                className="flex-1"
              />
              
              <Button
                size="icon"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AgentChat;
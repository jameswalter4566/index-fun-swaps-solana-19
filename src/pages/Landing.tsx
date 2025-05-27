import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { toast } from "sonner";

const Landing = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [isVapiListening, setIsVapiListening] = useState(false);

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
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Section 1: Hero */}
      <section 
        ref={el => sectionsRef.current[0] = el}
        className="h-screen flex flex-col items-center justify-center relative"
        style={{
          opacity: currentSection === 0 ? 1 : 0,
          transform: currentSection === 0 ? 'translateY(0)' : 'translateY(100px)',
          transition: 'all 0.8s ease-in-out'
        }}
      >
        <h1 className="text-6xl md:text-8xl font-bold mb-8 text-center animate-fade-in">
          AI Trading Agents are here
        </h1>
        
        <Button
          onClick={() => navigate('/index')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 rounded-full text-xl animate-pulse-glow mb-16"
          size="lg"
        >
          Create Your Agent Now
        </Button>

        {/* Mini Index Page Recreation */}
        <div className="w-full max-w-6xl mx-auto px-4">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-purple-500/20 p-6">
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
                  <Card className="bg-gray-800/50 p-4">
                    <p className="text-sm text-gray-400">Market Cap</p>
                    <p className="text-xl font-mono">${(mockTokenStats.marketCap / 1000000).toFixed(2)}M</p>
                  </Card>
                  <Card className="bg-gray-800/50 p-4">
                    <p className="text-sm text-gray-400">24h Volume</p>
                    <p className="text-xl font-mono">${(mockTokenStats.volume24h / 1000).toFixed(2)}K</p>
                  </Card>
                  <Card className="bg-gray-800/50 p-4">
                    <p className="text-sm text-gray-400">Holders</p>
                    <p className="text-xl font-mono">{mockTokenStats.holders.toLocaleString()}</p>
                  </Card>
                  <Card className="bg-gray-800/50 p-4">
                    <p className="text-sm text-gray-400">Liquidity</p>
                    <p className="text-xl font-mono">${(mockTokenStats.liquidity / 1000000).toFixed(2)}M</p>
                  </Card>
                </div>
              </div>

              {/* Top Traders & Holders */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Top Traders</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {mockTopTraders.slice(0, 5).map((trader) => (
                      <Card key={trader.wallet} className="bg-gray-800/50 p-3">
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
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Top Holders</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {mockTokenHolders.topHolders.slice(0, 5).map((holder) => (
                      <Card key={holder.wallet} className="bg-gray-800/50 p-3">
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
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Voice Chat Button */}
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleVapiClick}
                    className={`bg-purple-600 hover:bg-purple-700 text-white px-8 py-8 rounded-full text-lg animate-pulse-glow flex items-center gap-3 ${isVapiListening ? 'ring-4 ring-purple-400' : ''}`}
                    size="lg"
                  >
                    <Mic className={`w-8 h-8 ${isVapiListening ? 'animate-pulse' : ''}`} />
                    <span>Click here to start chatting with a trading agent now</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Placeholder for future sections */}
      <section 
        ref={el => sectionsRef.current[1] = el}
        className="h-screen flex items-center justify-center"
      >
        <h2 className="text-4xl">Section 2 - Coming Soon</h2>
      </section>
    </div>
  );
};

export default Landing;
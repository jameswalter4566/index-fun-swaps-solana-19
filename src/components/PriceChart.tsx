import React, { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export type Timeframe = '1m' | '15m' | '1h' | '4h' | '1d';

interface Props {
  tokens: Array<{
    address: string;
    name: string;
    symbol: string;
    marketCap: number;
  }>;
  title?: string;
  height?: number;
}

interface ChartData {
  time: number;
  value: number;
  displayTime: string;
}

const PriceChart: React.FC<Props> = ({ tokens, title = 'market cap history', height = 350 }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [data, setData] = useState<ChartData[]>([]);

  // Generate mock data based on tokens
  useEffect(() => {
    const generateMockData = () => {
      const now = Date.now();
      const dataPoints = 50;
      const interval = timeframe === '1m' ? 60000 : 
                      timeframe === '15m' ? 900000 :
                      timeframe === '1h' ? 3600000 :
                      timeframe === '4h' ? 14400000 : 86400000;
      
      const chartData: ChartData[] = [];
      let cumulative = 0;
      
      for (let i = dataPoints; i > 0; i--) {
        cumulative = 0;
        tokens.forEach((token, index) => {
          const variance = Math.sin(i * 0.1 + index) * 0.2 + 1;
          cumulative += token.marketCap * variance;
        });
        
        const time = now - (i * interval);
        chartData.push({
          time,
          value: cumulative,
          displayTime: format(new Date(time), timeframe === '1m' || timeframe === '15m' ? 'HH:mm' : 
                                            timeframe === '1h' || timeframe === '4h' ? 'MMM dd, HH:mm' : 
                                            'MMM dd')
        });
      }
      
      return chartData;
    };

    const chartData = generateMockData();
    setData(chartData);
  }, [tokens, timeframe]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (data.length > 0) {
        const lastValue = data[data.length - 1].value;
        const newValue = lastValue * (1 + (Math.random() - 0.5) * 0.02);
        const time = Date.now();
        
        const newData = [...data.slice(1), {
          time,
          value: newValue,
          displayTime: format(new Date(time), timeframe === '1m' || timeframe === '15m' ? 'HH:mm' : 
                                              timeframe === '1h' || timeframe === '4h' ? 'MMM dd, HH:mm' : 
                                              'MMM dd')
        }];

        setData(newData);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [data, timeframe]);

  const formatValue = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-stake-card p-3 rounded-lg border border-stake-border shadow-lg">
          <p className="text-stake-muted text-xs mb-1">{data.displayTime}</p>
          <p className="text-stake-text font-semibold">{formatValue(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  const timeframes: Timeframe[] = ['1m', '15m', '1h', '4h', '1d'];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stake-text">{title}</h3>
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeframe === tf
                  ? 'bg-stake-accent text-white'
                  : 'bg-stake-card text-stake-muted hover:text-stake-text hover:bg-stake-darkbg'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis 
            dataKey="displayTime" 
            stroke="#999"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#999"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00d4ff"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
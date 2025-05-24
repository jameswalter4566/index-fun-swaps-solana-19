import React, { useEffect, useState, useRef } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

export type Timeframe = '1m' | '15m' | '1h' | '4h' | '1d';

interface Candle {
  x: number; // Unix timestamp in ms
  y: [number, number, number, number]; // [open, high, low, close]
}

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

const PriceChart: React.FC<Props> = ({ tokens, title = 'market cap history', height = 350 }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [series, setSeries] = useState<any[]>([]);
  const chartRef = useRef<any>(null);

  // Generate mock data based on tokens
  useEffect(() => {
    // For now, we'll create area chart data based on cumulative market cap
    const generateMockData = () => {
      const now = Date.now();
      const dataPoints = 50;
      const interval = timeframe === '1m' ? 60000 : 
                      timeframe === '15m' ? 900000 :
                      timeframe === '1h' ? 3600000 :
                      timeframe === '4h' ? 14400000 : 86400000;
      
      const data: Array<{x: number, y: number}> = [];
      let cumulative = 0;
      
      for (let i = dataPoints; i > 0; i--) {
        cumulative = 0;
        tokens.forEach((token, index) => {
          const variance = Math.sin(i * 0.1 + index) * 0.2 + 1;
          cumulative += token.marketCap * variance;
        });
        
        data.push({
          x: now - (i * interval),
          y: cumulative
        });
      }
      
      return data;
    };

    const chartData = generateMockData();
    setSeries([{
      name: 'Total Market Cap',
      data: chartData
    }]);
  }, [tokens, timeframe]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (series.length > 0 && series[0].data.length > 0) {
        const lastValue = series[0].data[series[0].data.length - 1].y;
        const newValue = lastValue * (1 + (Math.random() - 0.5) * 0.02);
        
        const newData = [...series[0].data.slice(1), {
          x: Date.now(),
          y: newValue
        }];

        setSeries([{
          ...series[0],
          data: newData
        }]);

        // Update chart without re-render
        if (chartRef.current && window.ApexCharts) {
          window.ApexCharts.exec(
            'priceChart',
            'updateSeries',
            [{
              data: newData
            }],
            true
          );
        }
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [series]);

  const options: ApexOptions = {
    chart: {
      id: 'priceChart',
      type: 'area',
      height: height,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      background: 'transparent'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: ['#00d4ff']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: '#00d4ff',
            opacity: 0.8
          },
          {
            offset: 95,
            color: '#00d4ff',
            opacity: 0.1
          }
        ]
      }
    },
    theme: {
      mode: 'dark'
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#999',
          fontSize: '11px'
        },
        datetimeUTC: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#999',
          fontSize: '11px'
        },
        formatter: (val: number) => {
          if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
          if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
          if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
          return `$${val.toFixed(2)}`;
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: 'inherit'
      },
      x: {
        format: 'dd MMM HH:mm'
      },
      y: {
        formatter: (val: number) => {
          if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
          if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
          if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
          return `$${val.toFixed(2)}`;
        }
      }
    },
    grid: {
      borderColor: '#2a2a2a',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    }
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

      <Chart
        ref={chartRef}
        options={options}
        series={series}
        type="area"
        height={height}
      />
    </div>
  );
};

export default PriceChart;

import React from 'react';
import { ChartContainer } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface IndexChartProps {
  data: any[];
}

const IndexChart: React.FC<IndexChartProps> = ({ data }) => {
  return (
    <div className="h-[200px] mb-6 bg-stake-card rounded-lg p-2">
      <ChartContainer config={{}} className="h-full rounded-md">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{fill: '#9CA3AF'}} />
          <YAxis tick={{fill: '#9CA3AF'}} />
          <Tooltip />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#10B981" 
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

export default IndexChart;

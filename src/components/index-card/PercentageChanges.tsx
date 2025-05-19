
import React from 'react';

interface PercentageChangesProps {
  percentChange1h: number;
  percentChange6h: number;
  gainPercentage: number;
  marketCap?: number | null;
  formattedMarketCap?: string;
  isLive?: boolean;
}

const PercentageChanges: React.FC<PercentageChangesProps> = ({ 
  percentChange1h, 
  percentChange6h, 
  gainPercentage,
  marketCap,
  formattedMarketCap,
  isLive = false
}) => {
  const getPercentageColor = (value: number): string => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

  // Format the percentages with precision and + sign if positive
  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-3">
      {/* Market Cap Display (if provided) */}
      {formattedMarketCap && (
        <div className="bg-stake-darkbg/50 p-2 rounded-md">
          <span className="text-xs text-stake-muted">total weighted market cap</span>
          <p className={`text-sm font-semibold text-stake-text ${isLive ? 'animate-pulse-subtle' : ''}`}>
            {formattedMarketCap}
          </p>
        </div>
      )}
      
      {/* Percentage changes grid */}
      <div className="grid grid-cols-3 gap-3 bg-stake-card rounded-lg p-3">
        <div className="text-center">
          <h4 className="text-xs text-stake-muted">1h %</h4>
          <p className={`text-sm font-semibold ${getPercentageColor(percentChange1h)} ${isLive ? 'animate-pulse-subtle' : ''}`}>
            {formatPercentage(percentChange1h)}
          </p>
        </div>
        <div className="text-center">
          <h4 className="text-xs text-stake-muted">6h %</h4>
          <p className={`text-sm font-semibold ${getPercentageColor(percentChange6h)} ${isLive ? 'animate-pulse-subtle' : ''}`}>
            {formatPercentage(percentChange6h)}
          </p>
        </div>
        <div className="text-center">
          <h4 className="text-xs text-stake-muted">24h %</h4>
          <p className={`text-sm font-semibold ${getPercentageColor(gainPercentage)} ${isLive ? 'animate-pulse-subtle' : ''}`}>
            {formatPercentage(gainPercentage)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PercentageChanges;

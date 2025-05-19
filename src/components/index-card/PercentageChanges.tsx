
import React from 'react';

interface PercentageChangesProps {
  percentChange1h: number;
  percentChange6h: number;
  gainPercentage: number;
}

const PercentageChanges: React.FC<PercentageChangesProps> = ({ 
  percentChange1h, 
  percentChange6h, 
  gainPercentage 
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
    <div className="grid grid-cols-3 gap-3 mb-4 bg-stake-card rounded-lg p-3">
      <div className="text-center">
        <h4 className="text-xs text-stake-muted">1h %</h4>
        <p className={`text-sm font-semibold ${getPercentageColor(percentChange1h)}`}>
          {formatPercentage(percentChange1h)}
        </p>
      </div>
      <div className="text-center">
        <h4 className="text-xs text-stake-muted">6h %</h4>
        <p className={`text-sm font-semibold ${getPercentageColor(percentChange6h)}`}>
          {formatPercentage(percentChange6h)}
        </p>
      </div>
      <div className="text-center">
        <h4 className="text-xs text-stake-muted">24h %</h4>
        <p className={`text-sm font-semibold ${getPercentageColor(gainPercentage)}`}>
          {formatPercentage(gainPercentage)}
        </p>
      </div>
    </div>
  );
};

export default PercentageChanges;

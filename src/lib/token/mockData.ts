
/**
 * Generate mock volume data for an index in SOL
 * Generates values between 0.1 and 15 SOL
 */
export const generateMockVolume = (baseVolume?: number): number => {
  // If a base volume is provided, vary it slightly to simulate changes
  if (baseVolume) {
    const change = baseVolume * (Math.random() * 0.1 - 0.05); // -5% to +5%
    return Math.max(0.1, Math.min(15, baseVolume + change)); // Keep between 0.1 and 15
  }
  
  // Generate a new random volume between 0.1 and 15 SOL
  return 0.1 + Math.random() * 14.9; // 0.1 to 15 SOL range
};

/**
 * Generate chart data for a token or index
 */
export const generateChartData = (days: number = 30): { date: string, value: number }[] => {
  const data = [];
  const baseValue = 1000 + Math.random() * 500;
  const volatility = Math.random() * 0.15 + 0.05; // 5% to 20% volatility
  
  let currentValue = baseValue;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random daily change with momentum
    const change = (Math.random() * 2 - 1) * volatility * currentValue;
    currentValue = Math.max(currentValue + change, 100); // Ensure value doesn't go below 100
    
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      value: Math.round(currentValue),
    });
  }
  
  return data;
};


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

interface Token {
  name: string;
  address: string;
  symbol?: string;
}

interface IndexCardProps {
  id: string;
  name: string;
  tokens: Token[];
  gainPercentage: number;
  upvotes: number;
}

const IndexCard: React.FC<IndexCardProps> = ({ id, name, tokens, gainPercentage, upvotes }) => {
  const navigate = useNavigate();
  const [upvoted, setUpvoted] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  
  const handleUpvote = () => {
    if (!upvoted) {
      setCurrentUpvotes(currentUpvotes + 1);
      setUpvoted(true);
    } else {
      setCurrentUpvotes(currentUpvotes - 1);
      setUpvoted(false);
    }
  };

  const gainColor = gainPercentage >= 0 ? 'text-green-500' : 'text-red-500';
  
  return (
    <Card className="overflow-hidden card-hover border border-stake-card bg-stake-card">
      <CardHeader className="p-4 bg-stake-darkbg border-b border-stake-background">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-stake-text">{name}</CardTitle>
          <span className={`font-bold ${gainColor}`}>
            {gainPercentage >= 0 ? '+' : ''}{gainPercentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-stake-muted mb-2">Tokens</h4>
            <div className="flex flex-wrap gap-2">
              {tokens.map((token) => (
                <span 
                  key={token.address} 
                  className="inline-block bg-stake-darkbg rounded-full px-3 py-1 text-xs text-stake-text"
                >
                  {token.symbol || token.name}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-stake-background">
            <button 
              onClick={handleUpvote} 
              className={`flex items-center gap-1 text-sm ${upvoted ? 'text-stake-accent' : 'text-stake-muted'} hover:text-stake-accent transition-colors`}
            >
              <Heart size={16} className={upvoted ? 'fill-stake-accent' : ''} />
              <span>{currentUpvotes}</span>
            </button>
            
            <button 
              onClick={() => navigate(`/index/${id}`)}
              className="text-sm text-stake-accent hover:underline"
            >
              View Details
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndexCard;

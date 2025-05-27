
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/glass-card';
import { Heart } from 'lucide-react';

interface Token {
  name: string;
  address: string;
  symbol?: string;
  image?: string;
}

interface GuardianCardProps {
  id: string;
  name: string;
  tokens: Token[];
  gainPercentage: number;
  upvotes: number;
  onClick?: () => void;
}

const GuardianCard: React.FC<GuardianCardProps> = ({ id, name, tokens, gainPercentage, upvotes, onClick }) => {
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
    <GlassCard className="overflow-hidden" glow>
      <div className="p-4 bg-stake-darkbg/50 border-b border-stake-background/30">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-stake-text">{name}</h3>
          <span className={`font-bold ${gainColor}`}>
            {gainPercentage >= 0 ? '+' : ''}{gainPercentage}%
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-stake-muted mb-2">Monitoring Twitter Accounts</h4>
            <div className="space-y-2">
              {tokens.map((token) => {
                const metadata = token.metadata as any;
                const isTwitterAccount = token.name?.startsWith('@');
                
                if (isTwitterAccount && metadata) {
                  return (
                    <div 
                      key={token.address} 
                      className="flex items-center gap-2 bg-stake-darkbg rounded-lg p-2"
                    >
                      <img 
                        src={token.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.name}`} 
                        alt={token.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-stake-text truncate">
                            {metadata.display_name || token.name}
                          </span>
                          {metadata.verified && (
                            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-stake-muted">{token.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-stake-muted">
                          {metadata.followers_count ? `${(metadata.followers_count / 1000).toFixed(1)}K` : '0'} followers
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  // Fallback for non-Twitter tokens
                  return (
                    <div 
                      key={token.address} 
                      className="flex items-center gap-1.5 bg-stake-darkbg rounded-full px-3 py-1"
                    >
                      {token.image ? (
                        <img 
                          src={token.image} 
                          alt={token.name}
                          className="w-4 h-4 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-stake-accent/20" />
                      )}
                      <span className="text-xs text-stake-text">
                        {token.symbol || token.name}
                      </span>
                    </div>
                  );
                }
              })}
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
              onClick={() => navigate(`/guardian/${id}`)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 rounded-full text-sm transition-colors"
            >
              VIEW
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default GuardianCard;

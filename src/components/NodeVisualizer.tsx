import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Filter, Phone, Brain, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface NodeVisualizerProps {
  agentId: string;
}

const NodeVisualizer: React.FC<NodeVisualizerProps> = ({ agentId }) => {
  const { toast } = useToast();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    searchKeywords: ['', '', ''],
    excludeKeywords: ['', '', ''],
    socials: {
      twitter: false,
      telegram: false,
    },
    marketCap: { min: 0, max: 1000000 },
    liquidity: { min: 0, max: 500000 },
    volume24h: { min: 0, max: 100000 },
    priceChange: { min: -50, max: 100 },
    tokenAge: { max: 24 }, // hours
    buys: { min: 0 },
    sells: { min: 0, max: 1000 },
    burnPercentage: { min: 0 },
    freezeAuthority: null, // null, true, or false
    mintAuthority: null, // null, true, or false
  });

  const nodes = [
    { id: 'filters', label: 'Coin Trigger Filters', icon: Filter, x: 150, y: 100 },
    { id: 'notifications', label: 'SMS/Call Alerts', icon: Phone, x: 450, y: 100 },
    { id: 'ai', label: 'AI Analysis', icon: Brain, x: 150, y: 300 },
    { id: 'data', label: 'Data Sources', icon: Database, x: 450, y: 300 },
  ];

  const connections = [
    { from: 'filters', to: 'ai' },
    { from: 'notifications', to: 'ai' },
    { from: 'ai', to: 'data' },
  ];

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleFilterSave = async () => {
    try {
      // Transform the filters to match the edge function format
      const transformedFilters = {
        minMarketCap: filters.marketCap.min,
        maxMarketCap: filters.marketCap.max,
        minLiquidity: filters.liquidity.min,
        maxLiquidity: filters.liquidity.max,
        minVolume24h: filters.volume24h.min,
        maxVolume24h: filters.volume24h.max,
        minPriceChangePercentage: filters.priceChange.min,
        maxPriceChangePercentage: filters.priceChange.max,
        maxAge: filters.tokenAge.max,
        minBuys: filters.buys.min,
        minSells: filters.sells.min,
        maxSells: filters.sells.max,
        burnPercentage: filters.burnPercentage.min,
        freezeAuthority: filters.freezeAuthority,
        mintAuthority: filters.mintAuthority,
        // Add search keywords and socials as custom fields
        searchKeywords: filters.searchKeywords.filter(k => k !== ''),
        excludeKeywords: filters.excludeKeywords.filter(k => k !== ''),
        requiredSocials: filters.socials
      };

      const { data, error } = await supabase.functions.invoke('coin-parameters', {
        body: {
          method: 'POST',
          agentId: agentId,
          filters: transformedFilters
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Filter settings saved successfully",
      });
      
      setSelectedNode(null);
    } catch (error) {
      console.error('Error saving filters:', error);
      toast({
        title: "Error",
        description: "Failed to save filter settings",
        variant: "destructive",
      });
    }
  };

  const renderFilterDialog = () => (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Set Coin Trigger Filters</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        <div>
          <Label>Search Keywords (Max 3)</Label>
          <div className="space-y-2 mt-2">
            {filters.searchKeywords.map((keyword, index) => (
              <Input
                key={index}
                placeholder={`Keyword ${index + 1}`}
                value={keyword}
                onChange={(e) => {
                  const newKeywords = [...filters.searchKeywords];
                  newKeywords[index] = e.target.value;
                  setFilters({ ...filters, searchKeywords: newKeywords });
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>Exclude Keywords (Max 3)</Label>
          <div className="space-y-2 mt-2">
            {filters.excludeKeywords.map((keyword, index) => (
              <Input
                key={index}
                placeholder={`Exclude keyword ${index + 1}`}
                value={keyword}
                onChange={(e) => {
                  const newKeywords = [...filters.excludeKeywords];
                  newKeywords[index] = e.target.value;
                  setFilters({ ...filters, excludeKeywords: newKeywords });
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>Social Requirements</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {Object.entries(filters.socials).map(([social, enabled]) => (
              <div key={social} className="flex items-center space-x-2">
                <Checkbox
                  id={social}
                  checked={enabled}
                  onCheckedChange={(checked) => {
                    setFilters({
                      ...filters,
                      socials: { ...filters.socials, [social]: checked as boolean },
                    });
                  }}
                />
                <Label htmlFor={social} className="capitalize cursor-pointer">
                  {social}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Market Cap Range ($)</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Input
              type="number"
              value={filters.marketCap.min}
              onChange={(e) => setFilters({ ...filters, marketCap: { ...filters.marketCap, min: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="Min"
            />
            <span>to</span>
            <Input
              type="number"
              value={filters.marketCap.max}
              onChange={(e) => setFilters({ ...filters, marketCap: { ...filters.marketCap, max: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="Max"
            />
          </div>
        </div>

        <div>
          <Label>24h Volume Range ($)</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Input
              type="number"
              value={filters.volume24h.min}
              onChange={(e) => setFilters({ ...filters, volume24h: { ...filters.volume24h, min: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="Min"
            />
            <span>to</span>
            <Input
              type="number"
              value={filters.volume24h.max}
              onChange={(e) => setFilters({ ...filters, volume24h: { ...filters.volume24h, max: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="Max"
            />
          </div>
        </div>

        <div>
          <Label>Liquidity Range ($)</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Input
              type="number"
              value={filters.liquidity.min}
              onChange={(e) => setFilters({ ...filters, liquidity: { ...filters.liquidity, min: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="Min"
            />
            <span>to</span>
            <Input
              type="number"
              value={filters.liquidity.max}
              onChange={(e) => setFilters({ ...filters, liquidity: { ...filters.liquidity, max: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="Max"
            />
          </div>
        </div>

        <div>
          <Label>Price Change Range (%)</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Input
              type="number"
              value={filters.priceChange.min}
              onChange={(e) => setFilters({ ...filters, priceChange: { ...filters.priceChange, min: parseInt(e.target.value) || -100 } })}
              className="w-32"
              placeholder="Min"
            />
            <span>to</span>
            <Input
              type="number"
              value={filters.priceChange.max}
              onChange={(e) => setFilters({ ...filters, priceChange: { ...filters.priceChange, max: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="Max"
            />
          </div>
        </div>

        <div>
          <Label>Maximum Token Age (hours)</Label>
          <div className="mt-2">
            <Input
              type="number"
              value={filters.tokenAge.max}
              onChange={(e) => setFilters({ ...filters, tokenAge: { max: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="Max hours"
            />
          </div>
        </div>

        <div>
          <Label>Buy/Sell Activity</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-4">
              <Label className="w-20">Min Buys:</Label>
              <Input
                type="number"
                value={filters.buys.min}
                onChange={(e) => setFilters({ ...filters, buys: { min: parseInt(e.target.value) || 0 } })}
                className="w-32"
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Label className="w-20">Min Sells:</Label>
              <Input
                type="number"
                value={filters.sells.min}
                onChange={(e) => setFilters({ ...filters, sells: { ...filters.sells, min: parseInt(e.target.value) || 0 } })}
                className="w-32"
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Label className="w-20">Max Sells:</Label>
              <Input
                type="number"
                value={filters.sells.max}
                onChange={(e) => setFilters({ ...filters, sells: { ...filters.sells, max: parseInt(e.target.value) || 0 } })}
                className="w-32"
                placeholder="No limit"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>LP Burn Percentage (minimum)</Label>
          <div className="mt-2">
            <Input
              type="number"
              value={filters.burnPercentage.min}
              onChange={(e) => setFilters({ ...filters, burnPercentage: { min: parseInt(e.target.value) || 0 } })}
              className="w-32"
              placeholder="0"
            />
            <span className="ml-2 text-sm text-gray-500">%</span>
          </div>
        </div>

        <div>
          <Label>Security Settings</Label>
          <div className="space-y-2 mt-2">
            <div>
              <Label className="text-sm">Freeze Authority</Label>
              <Select
                value={filters.freezeAuthority === null ? 'any' : filters.freezeAuthority ? 'yes' : 'no'}
                onValueChange={(value) => {
                  setFilters({
                    ...filters,
                    freezeAuthority: value === 'any' ? null : value === 'yes'
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="no">Must NOT have</SelectItem>
                  <SelectItem value="yes">Must have</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Mint Authority</Label>
              <Select
                value={filters.mintAuthority === null ? 'any' : filters.mintAuthority ? 'yes' : 'no'}
                onValueChange={(value) => {
                  setFilters({
                    ...filters,
                    mintAuthority: value === 'any' ? null : value === 'yes'
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="no">Must NOT have</SelectItem>
                  <SelectItem value="yes">Must have</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setFilters({
            searchKeywords: ['', '', ''],
            excludeKeywords: ['', '', ''],
            socials: {
              twitter: false,
              telegram: false,
            },
            marketCap: { min: 0, max: 1000000 },
            liquidity: { min: 0, max: 500000 },
            volume24h: { min: 0, max: 100000 },
            priceChange: { min: -50, max: 100 },
            tokenAge: { max: 24 },
            buys: { min: 0 },
            sells: { min: 0, max: 1000 },
            burnPercentage: { min: 0 },
            freezeAuthority: null,
            mintAuthority: null,
          })}>
            Reset
          </Button>
          <Button onClick={handleFilterSave}>Apply</Button>
        </div>
      </div>
    </DialogContent>
  );

  const renderNotificationDialog = () => (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>SMS/Call Alert Settings</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
        </div>
        
        <div className="space-y-2">
          <Label>Alert Preferences</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="sms" />
              <Label htmlFor="sms" className="cursor-pointer">SMS Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="calls" />
              <Label htmlFor="calls" className="cursor-pointer">Phone Call Alerts</Label>
            </div>
          </div>
        </div>
        
        <Button className="w-full">Save Alert Settings</Button>
      </div>
    </DialogContent>
  );

  const renderAIDialog = () => (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>AI Analysis Configuration</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Analysis Frequency</Label>
          <Select defaultValue="realtime">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Real-time</SelectItem>
              <SelectItem value="5min">Every 5 minutes</SelectItem>
              <SelectItem value="15min">Every 15 minutes</SelectItem>
              <SelectItem value="30min">Every 30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Risk Tolerance</Label>
          <Select defaultValue="medium">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Conservative</SelectItem>
              <SelectItem value="medium">Moderate</SelectItem>
              <SelectItem value="high">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button className="w-full">Save AI Settings</Button>
      </div>
    </DialogContent>
  );

  const renderDataDialog = () => (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Data Source Configuration</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <Label>Select Data Sources</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="twitter" defaultChecked />
            <Label htmlFor="twitter" className="cursor-pointer">Twitter</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="pumpfun" />
            <Label htmlFor="pumpfun" className="cursor-pointer">Pump.fun</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="photon" />
            <Label htmlFor="photon" className="cursor-pointer">Photon</Label>
          </div>
        </div>
        
        <Button className="w-full">Save Data Sources</Button>
      </div>
    </DialogContent>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agent Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] bg-stake-darkbg rounded-lg overflow-hidden">
          <svg className="absolute inset-0 w-full h-full">
            {/* Draw connections */}
            {connections.map((conn, index) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              
              return (
                <line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#4a5568"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            })}
          </svg>
          
          {/* Draw nodes */}
          {nodes.map((node) => (
            <Dialog key={node.id} open={selectedNode === node.id} onOpenChange={(open) => !open && setSelectedNode(null)}>
              <DialogTrigger asChild>
                <button
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-stake-card hover:bg-stake-accent/20 border-2 border-stake-accent rounded-lg p-4 transition-all hover:scale-105 cursor-pointer"
                  style={{ left: node.x, top: node.y }}
                  onClick={() => handleNodeClick(node.id)}
                >
                  <node.icon className="w-8 h-8 text-stake-accent mb-2" />
                  <div className="text-xs text-stake-text whitespace-nowrap">{node.label}</div>
                </button>
              </DialogTrigger>
              
              {selectedNode === 'filters' && renderFilterDialog()}
              {selectedNode === 'notifications' && renderNotificationDialog()}
              {selectedNode === 'ai' && renderAIDialog()}
              {selectedNode === 'data' && renderDataDialog()}
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeVisualizer;
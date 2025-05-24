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

interface NodeVisualizerProps {
  agentId: string;
}

const NodeVisualizer: React.FC<NodeVisualizerProps> = ({ agentId }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    searchKeywords: ['', '', ''],
    excludeKeywords: ['', '', ''],
    socials: {
      twitter: false,
      website: false,
      telegram: false,
      youtube: false,
      tiktok: false,
      instagram: false,
    },
    marketCap: [0, 1000000],
    volume: [0, 100000],
    liquidity: [0, 50000],
    holdersCount: [0, 1000],
    botHolders: [0, 100],
    txns: [0, 1000],
    buys: [0, 500],
    sells: [0, 500],
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
          <Label>Market Cap Range</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Input
              type="number"
              value={filters.marketCap[0]}
              onChange={(e) => setFilters({ ...filters, marketCap: [parseInt(e.target.value), filters.marketCap[1]] })}
              className="w-32"
            />
            <span>to</span>
            <Input
              type="number"
              value={filters.marketCap[1]}
              onChange={(e) => setFilters({ ...filters, marketCap: [filters.marketCap[0], parseInt(e.target.value)] })}
              className="w-32"
            />
          </div>
        </div>

        <div>
          <Label>Volume Range</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Input
              type="number"
              value={filters.volume[0]}
              onChange={(e) => setFilters({ ...filters, volume: [parseInt(e.target.value), filters.volume[1]] })}
              className="w-32"
            />
            <span>to</span>
            <Input
              type="number"
              value={filters.volume[1]}
              onChange={(e) => setFilters({ ...filters, volume: [filters.volume[0], parseInt(e.target.value)] })}
              className="w-32"
            />
          </div>
        </div>

        <div>
          <Label>Liquidity Range ($)</Label>
          <div className="flex items-center space-x-4 mt-2">
            <Input
              type="number"
              value={filters.liquidity[0]}
              onChange={(e) => setFilters({ ...filters, liquidity: [parseInt(e.target.value), filters.liquidity[1]] })}
              className="w-32"
            />
            <span>to</span>
            <Input
              type="number"
              value={filters.liquidity[1]}
              onChange={(e) => setFilters({ ...filters, liquidity: [filters.liquidity[0], parseInt(e.target.value)] })}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setFilters({
            searchKeywords: ['', '', ''],
            excludeKeywords: ['', '', ''],
            socials: {
              twitter: false,
              website: false,
              telegram: false,
              youtube: false,
              tiktok: false,
              instagram: false,
            },
            marketCap: [0, 1000000],
            volume: [0, 100000],
            liquidity: [0, 50000],
            holdersCount: [0, 1000],
            botHolders: [0, 100],
            txns: [0, 1000],
            buys: [0, 500],
            sells: [0, 500],
          })}>
            Reset
          </Button>
          <Button onClick={() => setSelectedNode(null)}>Apply</Button>
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
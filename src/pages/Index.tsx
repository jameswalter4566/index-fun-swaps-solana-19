import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import IndexCard from '@/components/IndexCard';
import IndexDetailSidebar from '@/components/IndexDetailSidebar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import AgentChat from '@/components/AgentChat';
import NodeVisualizer from '@/components/NodeVisualizer';
import { Card, CardContent } from '@/components/ui/card';

interface IndexData {
  id: string;
  name: string;
  tokens: any[];
  creator_wallet: string;
  total_market_cap?: number;
  average_market_cap?: number;
  created_at: string;
  gainPercentage?: number;
  upvotes?: number;
  category?: string;
  createdAt?: Date;
}

const Index: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [indexes, setIndexes] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndexes();
  }, []);

  const fetchIndexes = async () => {
    try {
      const { data, error } = await supabase
        .from('indexes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIndexes(data || []);
    } catch (error) {
      console.error('Error fetching indexes:', error);
    } finally {
      setLoading(false);
    }
  };


  // Filter indexes based on search query and active tab
  const filteredIndexes = indexes.filter(index => {
    // Filter by search
    const matchesSearch = searchQuery === "" || 
      index.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      index.tokens.some(token => token.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by tab
    if (activeTab === "all") return matchesSearch;
    
    const matchesTab = 
      (activeTab === "top" && (index.upvotes || 0) > 100) ||
      (activeTab === "gainers" && (index.gainPercentage || 0) > 0) ||
      (activeTab === "recent" && (new Date().getTime() - new Date(index.created_at || index.createdAt || "").getTime()) / (1000 * 60 * 60 * 24) < 7);
    
    return matchesSearch && matchesTab;
  });

  return <Layout>
      <div className="flex gap-6">
        {/* Agent Chat - Left Side (40% width) */}
        <div className="w-[40%]">
          <Card className="h-[calc(100vh-8rem)] sticky top-8 bg-stake-card border-stake-border">
            <CardContent className="p-0 h-full">
              <AgentChat 
                agentName="Smart Agent" 
                agentId="default" 
                isPersistent={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Right Side (60% width) */}
        <div className="flex-1">
          <div className="mb-8 max-w-2xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl font-bold mb-4 text-stake-text">SMART</h1>
            <p className="text-stake-muted text-lg">personalize your own ai trading agent</p>
          </div>
      
      <div className="mb-8 max-w-md mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-stake-muted" />
        </div>
        <Input type="text" placeholder="search by index name or token" className="pl-10 rounded-md bg-stake-card border-stake-card text-stake-text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>
      
      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 max-w-md mx-auto bg-stake-darkbg">
          <TabsTrigger value="all" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">all</TabsTrigger>
          <TabsTrigger value="top" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">top rated</TabsTrigger>
          <TabsTrigger value="gainers" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">best gainers</TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">most recent</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))
            ) : filteredIndexes.length > 0 ? (
              filteredIndexes.map(index => (
                <IndexCard 
                  key={index.id} 
                  id={index.id} 
                  name={index.name} 
                  tokens={index.tokens} 
                  gainPercentage={index.gainPercentage || 0} 
                  upvotes={index.upvotes || 0}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no indexes found matching your search.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="top" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIndexes.length > 0 ? filteredIndexes.map(index => (
              <IndexCard 
                key={index.id} 
                id={index.id} 
                name={index.name} 
                tokens={index.tokens} 
                gainPercentage={index.gainPercentage || 0} 
                upvotes={index.upvotes || 0}
              />
            )) : <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no top-rated indexes found.</p>
              </div>}
          </div>
        </TabsContent>
        
        <TabsContent value="gainers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIndexes.length > 0 ? filteredIndexes.map(index => (
              <IndexCard 
                key={index.id} 
                id={index.id} 
                name={index.name} 
                tokens={index.tokens} 
                gainPercentage={index.gainPercentage || 0} 
                upvotes={index.upvotes || 0}
              />
            )) : <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no gaining indexes found.</p>
              </div>}
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIndexes.length > 0 ? filteredIndexes.map(index => (
              <IndexCard 
                key={index.id} 
                id={index.id} 
                name={index.name} 
                tokens={index.tokens} 
                gainPercentage={index.gainPercentage || 0} 
                upvotes={index.upvotes || 0}
              />
            )) : <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no recent indexes found.</p>
              </div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Agent Configuration */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-stake-text">Agent Configuration</h2>
        <NodeVisualizer agentId="default" />
      </div>
    </div>
  </div>
    </Layout>;
};
export default Index;
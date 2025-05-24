import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import IndexCard from '@/components/IndexCard';
import IndexDetailSidebar from '@/components/IndexDetailSidebar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface IndexData {
  id: string;
  name: string;
  tokens: any[];
  creator_wallet: string;
  total_market_cap: number;
  average_market_cap: number;
  created_at: string;
}

// Mock data for demonstration
const mockIndexes = [{
  id: '1',
  name: 'Dog Coin Army',
  tokens: [{
    name: 'DOGE',
    address: 'addr1'
  }, {
    name: 'SHIB',
    address: 'addr2'
  }, {
    name: 'FLOKI',
    address: 'addr3'
  }],
  gainPercentage: 24.5,
  upvotes: 142,
  category: 'gainers',
  createdAt: new Date('2023-05-10')
}, {
  id: '2',
  name: 'Solana Stars',
  tokens: [{
    name: 'BONK',
    address: 'addr4'
  }, {
    name: 'SAMO',
    address: 'addr5'
  }],
  gainPercentage: 36.8,
  upvotes: 89,
  category: 'gainers',
  createdAt: new Date('2023-05-14')
}, {
  id: '3',
  name: 'Meme Legends',
  tokens: [{
    name: 'PEPE',
    address: 'addr6'
  }, {
    name: 'WIF',
    address: 'addr7'
  }, {
    name: 'BONK',
    address: 'addr8'
  }, {
    name: 'MONG',
    address: 'addr9'
  }],
  gainPercentage: -12.3,
  upvotes: 215,
  category: 'top',
  createdAt: new Date('2023-05-01')
}, {
  id: '4',
  name: 'New Wave',
  tokens: [{
    name: 'BOOK',
    address: 'addr10'
  }, {
    name: 'TIKI',
    address: 'addr11'
  }],
  gainPercentage: 7.2,
  upvotes: 32,
  category: 'recent',
  createdAt: new Date('2023-05-17')
}, {
  id: '5',
  name: 'AI Tokens',
  tokens: [{
    name: 'BRAIN',
    address: 'addr12'
  }, {
    name: 'CHAT',
    address: 'addr13'
  }, {
    name: 'PREDICT',
    address: 'addr14'
  }],
  gainPercentage: 15.9,
  upvotes: 178,
  category: 'top',
  createdAt: new Date('2023-05-08')
}, {
  id: '6',
  name: 'Fresh Picks',
  tokens: [{
    name: 'NEW1',
    address: 'addr15'
  }, {
    name: 'NEW2',
    address: 'addr16'
  }],
  gainPercentage: 3.1,
  upvotes: 12,
  category: 'recent',
  createdAt: new Date('2023-05-18')
}];
const Index: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [indexes, setIndexes] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndexId, setSelectedIndexId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleIndexClick = (indexId: string) => {
    setSelectedIndexId(indexId);
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
    setSelectedIndexId(null);
  };

  // Combine real indexes with mock data for demonstration
  const allIndexes = [...indexes, ...mockIndexes];

  // Filter indexes based on search query and active tab
  const filteredIndexes = allIndexes.filter(index => {
    // Filter by search
    const matchesSearch = searchQuery === "" || 
      index.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      index.tokens.some(token => token.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by tab
    if (activeTab === "all") return matchesSearch;
    
    // For real indexes from database, we don't have upvotes/gainPercentage yet
    if (!('upvotes' in index)) return matchesSearch && activeTab === "recent";
    
    const matchesTab = 
      (activeTab === "top" && index.upvotes > 100) ||
      (activeTab === "gainers" && index.gainPercentage > 0) ||
      (activeTab === "recent" && (new Date().getTime() - new Date(index.created_at || index.createdAt).getTime()) / (1000 * 60 * 60 * 24) < 7);
    
    return matchesSearch && matchesTab;
  });
  return <Layout>
      {/* Twitter/X Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://x.com/index_fun"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 bg-black hover:bg-gray-900 text-white rounded-full shadow-lg transition-all hover:scale-110"
          aria-label="Follow us on X"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </div>

      <div className="mb-8 max-w-2xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 text-stake-text">index</h1>
        <p className="text-stake-muted text-lg">create instantly tradable token indexes. get paid when others swap.</p>
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
                  onClick={() => handleIndexClick(index.id)}
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
                gainPercentage={index.gainPercentage} 
                upvotes={index.upvotes}
                onClick={() => handleIndexClick(index.id)}
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
                gainPercentage={index.gainPercentage} 
                upvotes={index.upvotes}
                onClick={() => handleIndexClick(index.id)}
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
                gainPercentage={index.gainPercentage} 
                upvotes={index.upvotes}
                onClick={() => handleIndexClick(index.id)}
              />
            )) : <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no recent indexes found.</p>
              </div>}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Index Detail Sidebar */}
      <IndexDetailSidebar 
        indexId={selectedIndexId}
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
      />
    </Layout>;
};
export default Index;
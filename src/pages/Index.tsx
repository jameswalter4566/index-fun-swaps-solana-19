import React, { useState } from 'react';
import Layout from '@/components/Layout';
import IndexCard from '@/components/IndexCard';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

// Mock data
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

  // Filter indexes based on search query and active tab
  const filteredIndexes = mockIndexes.filter(index => {
    // Filter by search
    const matchesSearch = searchQuery === "" || index.name.toLowerCase().includes(searchQuery.toLowerCase()) || index.tokens.some(token => token.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by tab
    const matchesTab = activeTab === "all" || activeTab === "top" && index.upvotes > 100 || activeTab === "gainers" && index.gainPercentage > 0 || activeTab === "recent" && (new Date().getTime() - index.createdAt.getTime()) / (1000 * 60 * 60 * 24) < 7;
    return matchesSearch && matchesTab;
  });
  return <Layout>
      <div className="mb-8 max-w-2xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 text-stake-text">Index</h1>
        <p className="text-stake-muted text-lg">Create instantly tradable token indexes. Get paid when others swap.</p>
      </div>
      
      <div className="mb-8 max-w-md mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-stake-muted" />
        </div>
        <Input type="text" placeholder="Search by INDEX name or token" className="pl-10 rounded-md bg-stake-card border-stake-card text-stake-text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>
      
      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 max-w-md mx-auto bg-stake-darkbg">
          <TabsTrigger value="all" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="top" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">Top Rated</TabsTrigger>
          <TabsTrigger value="gainers" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">Best Gainers</TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">Most Recent</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIndexes.length > 0 ? filteredIndexes.map(index => <IndexCard key={index.id} id={index.id} name={index.name} tokens={index.tokens} gainPercentage={index.gainPercentage} upvotes={index.upvotes} />) : <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">No INDEXES found matching your search.</p>
              </div>}
          </div>
        </TabsContent>
        
        <TabsContent value="top" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIndexes.length > 0 ? filteredIndexes.map(index => <IndexCard key={index.id} id={index.id} name={index.name} tokens={index.tokens} gainPercentage={index.gainPercentage} upvotes={index.upvotes} />) : <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">No top-rated INDEXES found.</p>
              </div>}
          </div>
        </TabsContent>
        
        <TabsContent value="gainers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIndexes.length > 0 ? filteredIndexes.map(index => <IndexCard key={index.id} id={index.id} name={index.name} tokens={index.tokens} gainPercentage={index.gainPercentage} upvotes={index.upvotes} />) : <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">No gaining INDEXES found.</p>
              </div>}
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIndexes.length > 0 ? filteredIndexes.map(index => <IndexCard key={index.id} id={index.id} name={index.name} tokens={index.tokens} gainPercentage={index.gainPercentage} upvotes={index.upvotes} />) : <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">No recent INDEXES found.</p>
              </div>}
          </div>
        </TabsContent>
      </Tabs>
    </Layout>;
};
export default Index;
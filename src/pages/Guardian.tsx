import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import GuardianCard from '@/components/GuardianCard';
import GuardianDetailSidebar from '@/components/GuardianDetailSidebar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface GuardianData {
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

const Guardian: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [guardians, setGuardians] = useState<GuardianData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    try {
      const { data, error } = await supabase
        .from('indexes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGuardians(data || []);
    } catch (error) {
      console.error('Error fetching guardians:', error);
    } finally {
      setLoading(false);
    }
  };


  // Filter guardians based on search query and active tab
  const filteredGuardians = guardians.filter(guardian => {
    // Filter by search
    const matchesSearch = searchQuery === "" || 
      guardian.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      guardian.tokens.some(token => token.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by tab
    if (activeTab === "all") return matchesSearch;
    
    const matchesTab = 
      (activeTab === "top" && (guardian.upvotes || 0) > 100) ||
      (activeTab === "gainers" && (guardian.gainPercentage || 0) > 0) ||
      (activeTab === "recent" && (new Date().getTime() - new Date(guardian.created_at || guardian.createdAt || "").getTime()) / (1000 * 60 * 60 * 24) < 7);
    
    return matchesSearch && matchesTab;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 max-w-2xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-4 text-stake-text">Guardian</h1>
          <p className="text-stake-muted text-lg">personalize your own ai trading guardian</p>
        </div>
        
        <div className="mb-8 max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-stake-muted" />
          </div>
          <Input 
            type="text" 
            placeholder="search by guardian name or token" 
            className="pl-10 rounded-md bg-gray-800 border-stake-card text-stake-text" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
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
              ) : filteredGuardians.length > 0 ? (
                filteredGuardians.map(guardian => (
                  <GuardianCard 
                    key={guardian.id} 
                    id={guardian.id} 
                    name={guardian.name} 
                    tokens={guardian.tokens} 
                    gainPercentage={guardian.gainPercentage || 0} 
                    upvotes={guardian.upvotes || 0}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-stake-muted">no guardians found matching your search.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="top" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuardians.length > 0 ? filteredGuardians.map(guardian => (
                <GuardianCard 
                  key={guardian.id} 
                  id={guardian.id} 
                  name={guardian.name} 
                  tokens={guardian.tokens} 
                  gainPercentage={guardian.gainPercentage || 0} 
                  upvotes={guardian.upvotes || 0}
                />
              )) : <div className="col-span-full text-center py-8">
                  <p className="text-stake-muted">no top-rated guardians found.</p>
                </div>}
            </div>
          </TabsContent>
          
          <TabsContent value="gainers" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuardians.length > 0 ? filteredGuardians.map(guardian => (
                <GuardianCard 
                  key={guardian.id} 
                  id={guardian.id} 
                  name={guardian.name} 
                  tokens={guardian.tokens} 
                  gainPercentage={guardian.gainPercentage || 0} 
                  upvotes={guardian.upvotes || 0}
                />
              )) : <div className="col-span-full text-center py-8">
                  <p className="text-stake-muted">no gaining guardians found.</p>
                </div>}
            </div>
          </TabsContent>
          
          <TabsContent value="recent" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuardians.length > 0 ? filteredGuardians.map(guardian => (
                <GuardianCard 
                  key={guardian.id} 
                  id={guardian.id} 
                  name={guardian.name} 
                  tokens={guardian.tokens} 
                  gainPercentage={guardian.gainPercentage || 0} 
                  upvotes={guardian.upvotes || 0}
                />
              )) : <div className="col-span-full text-center py-8">
                  <p className="text-stake-muted">no recent guardians found.</p>
                </div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Guardian;
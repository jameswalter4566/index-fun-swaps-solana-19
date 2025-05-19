import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import IndexCard from '@/components/IndexCard';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/components/ui/sonner';

// Define the index type based on our database schema
interface Token {
  id: string;
  name: string;
  address: string;
  image_url?: string;
}

interface Index {
  id: string;
  name: string;
  creator_id: string;
  gain_percentage: number;
  upvotes: number;
  created_at: string;
  creator_username?: string;
  tokens: Token[];
}

const Index: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch indexes from Supabase
  useEffect(() => {
    const fetchIndexes = async () => {
      try {
        setLoading(true);
        
        // Get all indexes
        const { data: indexesData, error: indexesError } = await supabase
          .from('indexes')
          .select(`
            *,
            profiles:creator_id (
              username
            )
          `)
          .order('created_at', { ascending: false });
          
        if (indexesError) {
          throw new Error(indexesError.message);
        }
        
        // Get all index_tokens with their tokens
        const { data: indexTokensData, error: indexTokensError } = await supabase
          .from('index_tokens')
          .select(`
            index_id,
            tokens:token_id (*)
          `);
          
        if (indexTokensError) {
          throw new Error(indexTokensError.message);
        }
        
        // Combine data
        const processedIndexes = indexesData.map((index: any) => {
          // Find all tokens for this index
          const indexTokens = indexTokensData.filter(
            (it: any) => it.index_id === index.id
          );
          
          const tokens = indexTokens.map((it: any) => it.tokens);
          
          return {
            ...index,
            creator_username: index.profiles?.username,
            tokens,
          };
        });
        
        setIndexes(processedIndexes);
      } catch (error: any) {
        console.error("Error fetching indexes:", error);
        toast("Error loading indexes", {
          description: error.message || "Failed to load indexes",
          position: "bottom-center",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchIndexes();
  }, []);

  // Filter indexes based on search query and active tab
  const filteredIndexes = indexes.filter(index => {
    // Filter by search
    const matchesSearch = searchQuery === "" || 
      index.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      index.tokens.some(token => token.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by tab
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "top" && index.upvotes > 100) || 
      (activeTab === "gainers" && index.gain_percentage > 0) || 
      (activeTab === "recent" && new Date(index.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      
    return matchesSearch && matchesTab;
  });

  return (
    <Layout>
      <div className="mb-8 max-w-2xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 text-stake-text">index</h1>
        <p className="text-stake-muted text-lg">create instantly tradable token indexes. get paid when others swap.</p>
      </div>
      
      <div className="mb-8 max-w-md mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-stake-muted" />
        </div>
        <Input 
          type="text" 
          placeholder="search by index name or token" 
          className="pl-10 rounded-md bg-stake-card border-stake-card text-stake-text" 
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
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">loading indexes...</p>
              </div>
            ) : filteredIndexes.length > 0 ? (
              filteredIndexes.map(index => (
                <IndexCard 
                  key={index.id} 
                  id={index.id} 
                  name={index.name} 
                  tokens={index.tokens} 
                  gainPercentage={index.gain_percentage} 
                  upvotes={index.upvotes}
                  creatorUsername={index.creator_username}
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
            {loading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">loading top-rated indexes...</p>
              </div>
            ) : filteredIndexes.length > 0 ? (
              filteredIndexes.map(index => (
                <IndexCard 
                  key={index.id} 
                  id={index.id} 
                  name={index.name} 
                  tokens={index.tokens} 
                  gainPercentage={index.gain_percentage} 
                  upvotes={index.upvotes}
                  creatorUsername={index.creator_username}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no top-rated indexes found.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="gainers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">loading gaining indexes...</p>
              </div>
            ) : filteredIndexes.length > 0 ? (
              filteredIndexes.map(index => (
                <IndexCard 
                  key={index.id} 
                  id={index.id} 
                  name={index.name} 
                  tokens={index.tokens} 
                  gainPercentage={index.gain_percentage} 
                  upvotes={index.upvotes}
                  creatorUsername={index.creator_username}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no gaining indexes found.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">loading recent indexes...</p>
              </div>
            ) : filteredIndexes.length > 0 ? (
              filteredIndexes.map(index => (
                <IndexCard 
                  key={index.id} 
                  id={index.id} 
                  name={index.name} 
                  tokens={index.tokens} 
                  gainPercentage={index.gain_percentage} 
                  upvotes={index.upvotes}
                  creatorUsername={index.creator_username}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no recent indexes found.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Index;

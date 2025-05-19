import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import IndexCard from '@/components/IndexCard';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { useIndexStore, IndexData } from '@/stores/useIndexStore';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

const INDEXES_PER_PAGE = 25;

const Index: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("top-index");
  const [currentPage, setCurrentPage] = useState(1);
  const { getAllIndexes } = useIndexStore();
  const { publicKey } = useWallet();
  const { isRefreshing, lastRefreshed, refreshData } = useTokenRefresh();
  
  // Get indexes
  const indexes = getAllIndexes();
  
  // Filter indexes based on search query and active tab
  const filteredIndexes = indexes.filter(index => {
    // Filter by search
    const matchesSearch = 
      searchQuery === "" || 
      index.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      index.tokens.some(token => 
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (token.symbol && token.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    
    // Filter by tab
    const matchesTab = 
      (activeTab === "top-index") || 
      (activeTab === "top-rated" && index.upvotes > 0) || 
      (activeTab === "gainers" && (index.gainPercentage || 0) > 0) || 
      (activeTab === "recent" && new Date(index.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) ||
      (activeTab === "mine" && publicKey && index.creatorAddress === publicKey.toString());
    
    return matchesSearch && matchesTab;
  });
  
  // Sort indexes based on the active tab
  const sortedIndexes = [...filteredIndexes].sort((a, b) => {
    if (activeTab === "top-index") {
      // Sort by volume (highest first)
      return (b.totalVolume || 0) - (a.totalVolume || 0);
    } else if (activeTab === "top-rated") {
      // Sort by upvotes
      return b.upvotes - a.upvotes;
    } else if (activeTab === "gainers") {
      // Sort by 24h gain percentage
      return (b.gainPercentage || 0) - (a.gainPercentage || 0);
    } else if (activeTab === "recent") {
      // Sort by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Default sort by volume
    return (b.totalVolume || 0) - (a.totalVolume || 0);
  });
  
  // Pagination logic
  const totalPages = Math.ceil(sortedIndexes.length / INDEXES_PER_PAGE);
  const startIndex = (currentPage - 1) * INDEXES_PER_PAGE;
  const paginatedIndexes = sortedIndexes.slice(startIndex, startIndex + INDEXES_PER_PAGE);
  
  // Reset to first page when tab changes or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);
  
  // Initial data loading effect
  useEffect(() => {
    refreshData();
  }, []);
  
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
      
      <Tabs defaultValue="top-index" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 max-w-md mx-auto bg-stake-darkbg">
          <TabsTrigger value="top-index" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">top index</TabsTrigger>
          <TabsTrigger value="top-rated" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">top rated</TabsTrigger>
          <TabsTrigger value="gainers" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">gainers</TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">recent</TabsTrigger>
          <TabsTrigger value="mine" className="data-[state=active]:bg-stake-accent data-[state=active]:text-white">mine</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top-index" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedIndexes.length > 0 ? (
              paginatedIndexes.map(index => <IndexCard key={index.id} index={index} />)
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no indexes found matching your search.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="top-rated" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedIndexes.length > 0 ? (
              paginatedIndexes.map(index => <IndexCard key={index.id} index={index} />)
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no top-rated indexes found.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="gainers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedIndexes.length > 0 ? (
              paginatedIndexes.map(index => <IndexCard key={index.id} index={index} />)
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no gaining indexes found.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedIndexes.length > 0 ? (
              paginatedIndexes.map(index => <IndexCard key={index.id} index={index} />)
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">no recent indexes found.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="mine" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedIndexes.length > 0 ? (
              paginatedIndexes.map(index => <IndexCard key={index.id} index={index} />)
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-stake-muted">
                  {publicKey ? "you haven't created any indexes yet." : "connect your wallet to see your indexes."}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mb-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around the current page
              let pageNum;
              if (totalPages <= 5) {
                // If total pages <= 5, show all pages
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                // If near the start, show first 5 pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // If near the end, show last 5 pages
                pageNum = totalPages - 4 + i;
              } else {
                // Otherwise show 2 before and 2 after current page
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink 
                    onClick={() => setCurrentPage(pageNum)} 
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </Layout>
  );
};

export default Index;


import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/stores/useWalletStore';
import { useIndexStore, IndexData } from '@/stores/useIndexStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import CreateSwapForm from './CreateSwapForm';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { walletAddress, userProfile, setUserProfile } = useWalletStore();
  const { getIndexesByCreator } = useIndexStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState(userProfile?.username || '');
  const [userIndexes, setUserIndexes] = useState<IndexData[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Fetch user's indexes when component mounts or wallet address changes
  useEffect(() => {
    if (walletAddress) {
      const indexes = getIndexesByCreator(walletAddress);
      setUserIndexes(indexes);
    }
  }, [walletAddress, getIndexesByCreator]);
  
  const handleSave = () => {
    setUserProfile({ username });
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully",
    });
    onClose();
  };
  
  const handleViewIndex = (indexId: string) => {
    onClose();
    navigate(`/?index=${indexId}`);
  };

  return (
    <div className="p-6 rounded-xl shadow-lg w-full max-w-sm bg-stake-darkbg border border-stake-card">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-white">Your Profile</h2>
      </div>
      
      <div className="mb-5">
        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
          Username
        </label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className="w-full bg-stake-card border-stake-muted focus-visible:ring-stake-accent"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your Indexes
        </label>
        <div className="bg-stake-card rounded-md min-h-24">
          {userIndexes.length > 0 ? (
            <div className="divide-y divide-stake-background">
              {userIndexes.map((index) => (
                <div key={index.id} className="p-3 flex justify-between items-center hover:bg-stake-darkbg/10">
                  <div>
                    <p className="text-white font-medium">{index.name}</p>
                    <p className="text-xs text-stake-muted">
                      {index.tokens.length} tokens · {index.upvotes} upvotes
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewIndex(index.id)}
                    className="text-stake-accent hover:text-stake-accent hover:bg-stake-accent/10"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <p className="text-gray-400 text-sm mb-3">You haven't created any indexes yet</p>
              <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DrawerTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-stake-accent hover:bg-stake-accent/90"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create Index
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[80vh] bg-stake-background border-stake-card" data-drawer-close="true">
                  <div className="p-4 max-w-md mx-auto w-full">
                    <h2 className="text-xl font-bold mb-4 text-stake-text">Create New Index</h2>
                    <CreateSwapForm />
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          )}
        </div>
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
      >
        <Save className="mr-2 h-4 w-4" /> save profile
      </Button>
    </div>
  );
};

export default UserProfile;

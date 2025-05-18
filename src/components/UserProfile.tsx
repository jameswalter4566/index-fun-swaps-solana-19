
import React, { useState } from 'react';
import { useWalletStore } from '@/stores/useWalletStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { walletAddress, userProfile, setUserProfile } = useWalletStore();
  const { toast } = useToast();
  
  const [username, setUsername] = useState(userProfile?.username || '');
  
  const handleSave = () => {
    setUserProfile({ username });
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully",
    });
    onClose();
  };

  return (
    <div className="p-6 rounded-xl shadow-lg w-full max-w-sm bg-stake-darkbg border border-stake-card">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-white">Your Profile</h2>
        <button 
          className="text-gray-400 hover:text-white transition-colors"
          onClick={onClose}
        >
          &times;
        </button>
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
        <h3 className="text-md font-medium text-gray-300 mb-3">Your Indexes</h3>
        <div className="bg-stake-card p-4 rounded-md min-h-24 flex items-center justify-center">
          <p className="text-gray-400 text-sm">You haven't created any indexes yet</p>
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

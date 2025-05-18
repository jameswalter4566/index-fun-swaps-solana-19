
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
    <div className="p-4 bg-white rounded-md shadow-md w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Profile</h2>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
        <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">{walletAddress}</p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className="w-full"
        />
      </div>
      
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Your Indexes</h3>
        <div className="bg-gray-100 p-3 rounded min-h-16 flex items-center justify-center">
          <p className="text-gray-500 text-sm">You haven't created any indexes yet</p>
        </div>
      </div>
      
      <Button 
        onClick={handleSave}
        className="w-full bg-stake-highlight hover:bg-green-600 text-white"
      >
        <Save className="mr-2 h-4 w-4" /> save profile
      </Button>
    </div>
  );
};

export default UserProfile;

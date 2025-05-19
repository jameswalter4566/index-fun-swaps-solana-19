
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUsername: saveUsername } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }
    
    setIsSubmitting(true);
    const success = await saveUsername(username);
    
    if (success) {
      onClose();
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-stake-background border-stake-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-stake-text">Set Your Username</DialogTitle>
          <DialogDescription className="text-stake-muted">
            Choose a username for your profile. This will be displayed when you create indexes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-stake-text">Username</Label>
            <Input
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="bg-stake-card border-stake-card text-stake-text"
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-stake-accent hover:bg-stake-highlight text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Username'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameModal;

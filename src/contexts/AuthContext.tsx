
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/components/ui/sonner';

interface AuthContextType {
  walletAddress: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setUsername: (username: string) => Promise<boolean>;
  userData: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface PhantomWindow extends Window {
  solana?: {
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    isConnected: boolean;
    publicKey?: { toString: () => string };
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast: useToastFn } = useToast();

  // Check if Phantom wallet is available
  const getProvider = () => {
    const phantomWindow = window as PhantomWindow;
    if ('solana' in phantomWindow) {
      return phantomWindow.solana;
    }
    return null;
  };

  // Check for existing session and wallet on load
  useEffect(() => {
    const checkSession = async () => {
      const provider = getProvider();
      
      // Check if wallet is connected
      if (provider && provider.isConnected && provider.publicKey) {
        const address = provider.publicKey.toString();
        setWalletAddress(address);
        
        // Fetch user profile if wallet is connected
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('wallet_address', address)
            .single();
          
          if (error) {
            console.error("Error fetching user profile:", error);
          } else if (data) {
            setUsernameState(data.username);
            setUserData(data);
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
        }
      }
      
      setIsLoading(false);
    };
    
    checkSession();
  }, []);

  const connectWallet = async () => {
    try {
      const provider = getProvider();
      
      if (!provider) {
        toast("Phantom wallet not found", {
          description: "Please install Phantom wallet extension",
          position: "bottom-center",
        });
        return;
      }
      
      setIsLoading(true);
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);
      
      // Check if user profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
      }
      
      if (data) {
        setUsernameState(data.username);
        setUserData(data);
      }
      
      setIsLoading(false);
      toast("Wallet connected", {
        description: "Your Phantom wallet has been connected",
        position: "bottom-center",
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setIsLoading(false);
      toast("Connection failed", {
        description: "Failed to connect to Phantom wallet",
        position: "bottom-center",
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      const provider = getProvider();
      
      if (provider) {
        await provider.disconnect();
      }
      
      setWalletAddress(null);
      setUsernameState(null);
      setUserData(null);
      
      toast("Wallet disconnected", {
        description: "Your Phantom wallet has been disconnected",
        position: "bottom-center",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast("Disconnection failed", {
        description: "Failed to disconnect from Phantom wallet",
        position: "bottom-center",
      });
    }
  };

  // Set username and create profile
  const setUsername = async (newUsername: string): Promise<boolean> => {
    if (!walletAddress) {
      toast("Wallet not connected", {
        description: "Please connect your wallet first",
        position: "bottom-center",
      });
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Check if username is taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', newUsername)
        .single();
      
      if (existingUser) {
        toast("Username taken", {
          description: "This username is already taken",
          position: "bottom-center",
        });
        setIsLoading(false);
        return false;
      }
      
      // Create or update profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          username: newUsername,
          wallet_address: walletAddress,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error setting username:", error);
        toast("Failed to set username", {
          description: error.message,
          position: "bottom-center",
        });
        setIsLoading(false);
        return false;
      }
      
      setUsernameState(newUsername);
      setUserData(data);
      
      toast("Username set", {
        description: `Your username has been set to ${newUsername}`,
        position: "bottom-center",
      });
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error("Error setting username:", error);
      toast("Failed to set username", {
        description: error.message || "An unknown error occurred",
        position: "bottom-center",
      });
      setIsLoading(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        walletAddress,
        username,
        isAuthenticated: !!walletAddress,
        isLoading,
        connectWallet,
        disconnectWallet,
        setUsername,
        userData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

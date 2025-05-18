
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  username: string;
}

interface WalletState {
  connected: boolean;
  walletAddress: string | null;
  connecting: boolean;
  userProfile: UserProfile | null;
  setConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  setUserProfile: (profile: UserProfile) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      connected: false,
      walletAddress: null,
      connecting: false,
      userProfile: null,
      setConnected: (connected) => set({ connected }),
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      setConnecting: (connecting) => set({ connecting }),
      setUserProfile: (userProfile) => set({ userProfile }),
    }),
    {
      name: 'wallet-storage', // unique name for localStorage
    }
  )
);

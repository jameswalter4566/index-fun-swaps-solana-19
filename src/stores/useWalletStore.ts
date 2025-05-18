
import { create } from 'zustand';

interface WalletState {
  connected: boolean;
  walletAddress: string | null;
  connecting: boolean;
  setConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setConnecting: (connecting: boolean) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  walletAddress: null,
  connecting: false,
  setConnected: (connected) => set({ connected }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  setConnecting: (connecting) => set({ connecting })
}));

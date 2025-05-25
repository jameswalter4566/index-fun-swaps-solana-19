
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import Index from "./pages/Index";
import CreateSwap from "./pages/CreateSwap";
import IndexDetail from "./pages/IndexDetail";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import { VapiDebug } from "./components/VapiDebug";
import { VapiWebRTCDebug } from "./components/VapiWebRTCDebug";
import { VapiWebSocketChat } from "./components/VapiWebSocketChat";

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

const App = () => {
  // Configure Solana network and wallets
  const network = 'mainnet-beta'; // or 'devnet' for testing
  const endpoint = useMemo(() => clusterApiUrl(network), []);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/create-swap" element={<CreateSwap />} />
                  <Route path="/index/:id" element={<IndexDetail />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/debug" element={<VapiDebug />} />
                  <Route path="/debug-webrtc" element={<VapiWebRTCDebug />} />
                  <Route path="/websocket" element={<VapiWebSocketChat />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;


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
import Guardian from "./pages/Guardian";
import CreateSwap from "./pages/CreateSwap";
import GuardianDetail from "./pages/GuardianDetail";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Documentation from "./pages/Documentation";
import { VapiDebug } from "./components/VapiDebug";
import { VapiWebRTCDebug } from "./components/VapiWebRTCDebug";
import { VapiWebSocketChat } from "./components/VapiWebSocketChat";

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

const App = () => {
  // Configure Solana network and wallets
  const network = 'mainnet-beta'; // or 'devnet' for testing
  const endpoint = useMemo(() => 'https://mainnet.helius-rpc.com/?api-key=9c6bbd13-8d15-4803-8c06-a08cf73ac3f8', []);
  
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
                  <Route path="/" element={<Landing />} />
                  <Route path="/guardian" element={<Guardian />} />
                  <Route path="/index" element={<Guardian />} />
                  <Route path="/create-swap" element={<CreateSwap />} />
                  <Route path="/guardian/:id" element={<GuardianDetail />} />
                  <Route path="/index/:id" element={<GuardianDetail />} />
                  <Route path="/documentation" element={<Documentation />} />
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

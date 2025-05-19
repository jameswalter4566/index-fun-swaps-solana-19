
import { supabase } from './supabase';
import { toast } from 'sonner';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

// This function handles signing in a user with their Solana wallet
export async function signInWithSolanaWallet(publicKey: string, signMessage: (message: Uint8Array) => Promise<Uint8Array>) {
  try {
    // 1. Get a nonce from Supabase
    const { data: { nonce }, error: nonceError } = await supabase.auth.signUp({
      email: `${publicKey}@solana-wallet.local`, // Use a placeholder email
      password: crypto.randomUUID(), // Use a random password (never used)
      options: {
        data: {
          wallet_address: publicKey,
        }
      }
    });
    
    if (nonceError) {
      console.error("Error getting nonce:", nonceError);
      throw nonceError;
    }

    // 2. Create a message for the user to sign
    const message = new TextEncoder().encode(`Authenticate with your wallet: ${nonce}`);
    
    // 3. Ask the user to sign the message
    const signature = await signMessage(message);
    
    // 4. Verify the signature and sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${publicKey}@solana-wallet.local`,
      password: bs58.encode(signature),
    });
    
    if (error) {
      console.error("Error signing in:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Authentication error:", error);
    toast.error("Failed to authenticate with wallet", {
      description: "Please try again later",
    });
    throw error;
  }
}

// Sync wallet connection state with Supabase auth
export async function syncWalletWithAuth(publicKey: string | null, signMessage?: (message: Uint8Array) => Promise<Uint8Array>) {
  if (!publicKey) {
    // Sign out if wallet disconnected
    await supabase.auth.signOut();
    return null;
  }
  
  if (signMessage) {
    try {
      return await signInWithSolanaWallet(publicKey, signMessage);
    } catch (error) {
      console.error("Failed to sync wallet with auth:", error);
      return null;
    }
  }
  
  return null;
}

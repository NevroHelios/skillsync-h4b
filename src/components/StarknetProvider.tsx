"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { connect, disconnect } from "get-starknet";
import type { AccountInterface } from "starknet";
import { StarknetService } from "@/lib/starknet-service";

interface StarknetContextType {
  account: AccountInterface | null;
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isConnecting: boolean;
  starknetService: StarknetService | null;
  networkName: string | null;
  balance: string | null;
  error: string | null;
  walletType: string | null;
}

const StarknetContext = createContext<StarknetContextType>({
  account: null,
  address: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  isConnecting: false,
  starknetService: null,
  networkName: null,
  balance: null,
  error: null,
  walletType: null,
});

export const useStarknet = () => useContext(StarknetContext);

export function StarknetProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starknetService, setStarknetService] = useState<StarknetService | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);

  // Get network name based on chainId
  const getNetworkName = (chainId: string | undefined): string => {
    if (!chainId) return "Unknown";
    
    switch (chainId.toString()) {
      case "0x534e5f4d41494e": // SN_MAIN
        return "Mainnet";
      case "0x534e5f474f45524c49": // SN_GOERLI
        return "Goerli";
      case "0x534e5f5345504f4c4941": // SN_SEPOLIA
        return "Sepolia";
      default:
        return "Unknown";
    }
  };

  // Get wallet type name
  const getWalletType = (wallet: any): string => {
    if (!wallet) return "Unknown";
    
    // Extract name from available wallet info
    if (wallet.name) {
      return wallet.name;
    } else if (wallet.id && typeof wallet.id === 'string') {
      // Format wallet ID if available (e.g., "argentX" -> "Argent X")
      const id = wallet.id;
      if (id.toLowerCase().includes("argent")) return "Argent X";
      if (id.toLowerCase().includes("braavos")) return "Braavos";
      return id.charAt(0).toUpperCase() + id.slice(1);
    }
    
    return "Starknet Wallet";
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const starknet = await connect();
        if ((starknet as any).isConnected) {
          const connectedAccount = (starknet as any).account;
          setAccount(connectedAccount);
          setAddress(connectedAccount.address);
          
          // Set network and wallet type
          setNetworkName(getNetworkName((starknet as any).chainId));
          setWalletType(getWalletType((starknet as any).wallet));
          
          // Initialize StarknetService with the connected account
          const service = new StarknetService(connectedAccount);
          setStarknetService(service);

          // Try to get ETH balance - simplified example
          try {
            // This is a simplified version - you'd use an actual balance query
            const balanceResponse = await connectedAccount.getBalance({
              contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" // ETH contract
            });
            // Format balance from wei to ETH (simplified)
            const ethBalance = (parseInt(balanceResponse.balance.toString()) / 10**18).toFixed(4);
            setBalance(ethBalance);
          } catch (balanceErr) {
            console.warn("Failed to fetch balance:", balanceErr);
          }
        }
      } catch (e) {
        console.error("Failed to reconnect wallet:", e);
      }
    };

    checkConnection();
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Use the imported connect function instead of getStarknet
      const starknet = await connect({
        modalMode: "neverAsk",
        modalTheme: "system"
      });
      
      if (!(starknet as any).isConnected) {
        // Show wallet selection UI when available
        await (starknet as any).enable({
          showList: true
        });
      }
      
      const connectedAccount = (starknet as any).account;
      setAccount(connectedAccount);
      setAddress(connectedAccount.address);
      
      // Set network and wallet type
      setNetworkName(getNetworkName((starknet as any).chainId));
      setWalletType(getWalletType((starknet as any).wallet));
      
      // Initialize StarknetService with the connected account
      const service = new StarknetService(connectedAccount);
      setStarknetService(service);
      
      // Try to get ETH balance - simplified example
      try {
        // This is a simplified version - you'd use an actual balance query
        const balanceResponse = await connectedAccount.getBalance({
          contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" // ETH contract
        });
        // Format balance from wei to ETH (simplified)
        const ethBalance = (parseInt(balanceResponse.balance.toString()) / 10**18).toFixed(4);
        setBalance(ethBalance);
      } catch (balanceErr) {
        console.warn("Failed to fetch balance:", balanceErr);
      }
    } catch (e) {
      console.error("Error connecting wallet:", e);
      let errorMessage = "Failed to connect wallet. Please try again.";
      
      // More detailed error messages based on common issues
      if (e instanceof Error) {
        if (e.message.includes("User rejected")) {
          errorMessage = "Connection rejected. Please approve the connection request in your wallet.";
        } else if (e.message.includes("not found") || e.message.includes("no provider")) {
          errorMessage = "No Starknet wallet found. Please install Argent X or Braavos.";
        } else if (e.message.includes("network") || e.message.includes("chain")) {
          errorMessage = "Network mismatch. Please switch to the correct network in your wallet.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      // Use the imported disconnect function directly
      await disconnect();
      
      // Reset all state
      setAccount(null);
      setAddress(null);
      setStarknetService(null);
      setNetworkName(null);
      setBalance(null);
      setWalletType(null);
    } catch (e) {
      console.error("Error disconnecting wallet:", e);
      setError("Failed to disconnect wallet. Please try again.");
    }
  };

  const contextValue = {
    account,
    address,
    connectWallet,
    disconnectWallet,
    isConnecting,
    starknetService,
    networkName,
    balance,
    error,
    walletType
  };

  return (
    <StarknetContext.Provider value={contextValue}>
      {children}
    </StarknetContext.Provider>
  );
}
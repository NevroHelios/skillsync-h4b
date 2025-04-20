import React, { useState, useEffect } from "react";
import { connect, disconnect } from "get-starknet";
import { encode } from "starknet";
import { toast } from "react-toastify";

interface WalletConnectButtonProps {
  onWalletConnected?: () => void;
  saveToProfile?: boolean;
}

function WalletConnectButton({ onWalletConnected, saveToProfile = false }: WalletConnectButtonProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletName, setWalletName] = useState("");
  const [wallet, setWallet] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // restore from localStorage on mount and notify parent if found
  useEffect(() => {
    const addr = localStorage.getItem("walletAddress");
    const name = localStorage.getItem("walletName");
    if (addr) {
      setWalletAddress(addr);
      if (onWalletConnected) {
        onWalletConnected();
      }
      
      // If saving to profile is enabled and we have an address in localStorage, save it to profile
      if (saveToProfile) {
        saveWalletAddressToProfile(addr);
      }
    }
    if (name) setWalletName(name);
  }, [onWalletConnected, saveToProfile]);

  const saveWalletAddressToProfile = async (address: string) => {
    if (!address || isSaving) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save wallet address');
      }
      
      console.log('Wallet address saved to profile');
    } catch (err) {
      console.error('Failed to save wallet address to profile:', err);
      toast.error('Failed to save wallet address to your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect({ clearLastWallet: true });
    setWallet("");
    setWalletAddress("");
    setWalletName("");
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("walletName");
  };

  const handleConnect = async () => {
    try {
      const getWallet = await connect({
        modalMode: "alwaysAsk",
        modalTheme: "dark",
      });
      await getWallet?.enable({ starknetVersion: "v5" });
      setWallet(getWallet as any);
      const addr = encode.addHexPrefix(
        encode.removeHexPrefix(getWallet?.selectedAddress ?? "0x").padStart(64, "0")
      );
      setWalletAddress(addr);
      setWalletName(getWallet?.name || "");

      // persist for reload
      localStorage.setItem("walletAddress", addr);
      localStorage.setItem("walletName", getWallet?.name || "");
      
      // Save to profile if enabled
      if (saveToProfile) {
        await saveWalletAddressToProfile(addr);
      }
      
      // Notify parent component that wallet is connected
      if (onWalletConnected) {
        onWalletConnected();
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="inline-block">
      {!walletAddress ? (
      <button
        onClick={handleConnect}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        Connect Wallet
      </button>
      ) : (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 text-sm text-gray-200 bg-gray-700 rounded">
        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
        <button
        onClick={handleDisconnect}
        className="p-2 text-gray-400 hover:text-gray-200"
        >
        ⨉
        </button>
      </div>
      )}
    </div>
  );
}

export default WalletConnectButton;
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
    <div className="flex flex-col items-center bg-gray-800 p-4 rounded-lg shadow-md gap-4">
      {!walletAddress && (
        <button
          onClick={handleConnect}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Connect Wallet
        </button>
      )}
      {walletAddress && (
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Disconnect
          </button>
          <div className="bg-gray-700 text-gray-200 text-sm p-3 rounded-md w-full break-words">
            <p>
              <span className="font-medium">Wallet:</span>{" "}
              {walletName || "Unknown"}
            </p>
            <p>
              <span className="font-medium">Address:</span> {walletAddress}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletConnectButton;
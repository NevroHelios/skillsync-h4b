import React, { useState, useEffect } from 'react';
import WalletConnectButton from './WalletConnectButton';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

// Helper to validate StarkNet address
const isValidStarknetAddress = (address: string | null): boolean => {
  if (!address) return false;
  // Check if address is all zeros (except 0x prefix)
  const strippedAddress = address.startsWith('0x') ? address.substring(2) : address;
  return strippedAddress.length === 64 && !/^0*$/.test(strippedAddress);
};

const DeveloperWalletConnect: React.FC = () => {
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const isValidAddress = isValidStarknetAddress(savedAddress);
  
  useEffect(() => {
    // Get the wallet address from localStorage if available
    const addr = localStorage.getItem("walletAddress");
    setSavedAddress(addr);
  }, []);

  return (
    <div className="w-[400px] bg-white/5 backdrop-blur-sm rounded-xl p-4 mt-4">
      <div className="flex flex-col space-y-3">
        <h3 className="text-lg font-medium text-gray-100">Wallet Status</h3>
        
        <div className="flex flex-col items-center space-y-3">
          <WalletConnectButton saveToProfile={true} />
          
          {savedAddress && (
            <div className="w-full px-3 py-2 rounded-lg bg-white/5">
              {isValidAddress ? (
                <div className="flex items-center space-x-2 text-emerald-400">
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="text-sm">Wallet verified & connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-amber-400">
                  <FiAlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Invalid wallet address</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperWalletConnect;

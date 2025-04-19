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
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 mb-6">
      <h3 className="text-lg font-bold text-white mb-3">Connect Your Starknet Wallet</h3>
      <p className="text-gray-300 mb-4">
        Connecting your wallet allows companies to directly mint Hire NFTs to your address 
        when you're selected for a position.
      </p>
      
      <WalletConnectButton saveToProfile={true} />
      
      {savedAddress && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          {isValidAddress ? (
            <div className="text-green-400 flex items-center gap-2">
              <FiCheckCircle />
              <span>Wallet address saved to your profile</span>
            </div>
          ) : (
            <div className="text-yellow-400 flex items-center gap-2">
              <FiAlertTriangle />
              <span>Your wallet address appears invalid. Please try reconnecting.</span>
            </div>
          )}
        </div>
      )}
      <p className="text-sm text-gray-400 mt-3">
        Your wallet address will be securely stored and visible to HR when they select you for positions.
      </p>
    </div>
  );
};

export default DeveloperWalletConnect;

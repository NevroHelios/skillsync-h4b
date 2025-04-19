import React, { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import WalletConnectButton from './WalletConnectButton';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMint: () => void;
  applicantAddress: string;
}

// Helper function to check if a StarkNet address is valid (not all zeros or invalid)
const isValidStarknetAddress = (address: string | undefined): boolean => {
  if (!address) return false;
  // Check if address is all zeros (except 0x prefix)
  const strippedAddress = address.startsWith('0x') ? address.substring(2) : address;
  return strippedAddress.length === 64 && !/^0*$/.test(strippedAddress);
};

// Helper to format address for display
const formatAddress = (address: string): string => {
  if (!address) return '';
  return address.length > 10 ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : address;
};

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen, onClose, onMint, applicantAddress
}) => {
  const [storedWallet, setStoredWallet] = useState<string | null>(null);
  
  // Check if addresses are valid
  const hrWalletIsValid = storedWallet && isValidStarknetAddress(storedWallet);
  const devWalletIsValid = isValidStarknetAddress(applicantAddress);

  useEffect(() => {
    const addr = localStorage.getItem("walletAddress");
    setStoredWallet(addr);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6 relative border border-gray-700">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">
          <FiX size={20}/>
        </button>

        <h3 className="text-xl font-bold text-white mb-4">Connect your Starknet wallet</h3>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-3 h-3 rounded-full ${hrWalletIsValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h4 className="text-sm font-medium text-gray-300">HR Wallet Status</h4>
          </div>
          {storedWallet ? (
            <>
              <p className="text-gray-300 text-sm ml-5">
                Address: <span className="font-mono text-white">{formatAddress(storedWallet)}</span>
              </p>
              {!hrWalletIsValid && (
                <p className="text-red-400 text-xs ml-5 mt-1 flex items-center gap-1">
                  <FiAlertTriangle />
                  <span>Invalid address. Please reconnect your wallet.</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-yellow-400 text-sm ml-5">Not connected</p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-3 h-3 rounded-full ${devWalletIsValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h4 className="text-sm font-medium text-gray-300">Applicant Wallet Status</h4>
          </div>
          {applicantAddress ? (
            <>
              <p className="text-gray-300 text-sm ml-5">
                Address: <span className="font-mono text-white">{formatAddress(applicantAddress)}</span>
              </p>
              {!devWalletIsValid && (
                <p className="text-red-400 text-xs ml-5 mt-1 flex items-center gap-1">
                  <FiAlertTriangle />
                  <span>Invalid address. The applicant needs to connect their wallet in their profile.</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-red-400 text-sm ml-5">No wallet connected</p>
          )}
        </div>

        {!storedWallet && (
          <div className="mb-6 border-t border-gray-700 pt-4">
            <p className="text-gray-300 mb-4">
              Please connect your Starknet wallet to continue.
            </p>
            <WalletConnectButton onWalletConnected={() => {
              const addr = localStorage.getItem("walletAddress");
              setStoredWallet(addr);
            }} />
          </div>
        )}

        {storedWallet && (
          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={onMint}
              className={`w-full ${
                hrWalletIsValid && devWalletIsValid 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              } text-white font-semibold px-4 py-2 rounded-lg transition`}
              disabled={!hrWalletIsValid || !devWalletIsValid}
            >
              {hrWalletIsValid && devWalletIsValid 
                ? 'Mint Hire NFT' 
                : 'Cannot Mint (Wallet Issues)'}
            </button>
            
            {(!hrWalletIsValid || !devWalletIsValid) && (
              <p className="text-yellow-400 text-xs mt-2">
                Both HR and applicant need valid wallet addresses to mint the NFT.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnectModal;

import React, { useRef } from 'react';
import { FiX, FiAlertTriangle, FiLoader, FiCheckCircle } from 'react-icons/fi';
import WalletConnectButton from './WalletConnectButton';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMint: (uri: string) => Promise<void> | void; // Pass uri to parent
  applicantAddress: string;
  hrWalletAddress: string | null;
  hrWalletIsValid: boolean;
  mintingState?: 'idle' | 'prompt' | 'pending' | 'success' | 'error';
  mintError?: string | null;
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
  isOpen, onClose, onMint, applicantAddress, hrWalletAddress, hrWalletIsValid,
  mintingState = 'idle', mintError = null
}) => {
  const localHrWalletAddress = hrWalletAddress || localStorage.getItem("walletAddress") || "";
  const localHrWalletIsValid = localHrWalletAddress ;
  const devWalletIsValid = isValidStarknetAddress(applicantAddress);

  const [uri, setUri] = React.useState('');
  const [clicked, setClicked] = React.useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  console.log("applicantAddress: ", applicantAddress)

  React.useEffect(() => {
    // Reset clicked state and URI when modal closes or minting state resets
    if (!isOpen || mintingState === 'idle' || mintingState === 'success' || mintingState === 'error') {
      setClicked(false);
      setUri('');
    }
  }, [isOpen, mintingState]);

  if (!isOpen) return null;

  // Only allow mint if both addresses are valid, uri is provided, and not minting
  const canMint = localHrWalletIsValid && devWalletIsValid && !!uri.trim() && mintingState !== 'pending' && mintingState !== 'prompt';

  // --- DEBUG LOGS ---
  console.debug('[WalletConnectModal] Rendered', {
    isOpen,
    localHrWalletAddress,
    localHrWalletIsValid,
    applicantAddress,
    devWalletIsValid,
    uri,
    canMint,
    mintingState,
    mintError
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6 relative border border-gray-700">
        <button onClick={() => {
          console.debug('[WalletConnectModal] Close clicked');
          onClose();
        }} className="absolute top-2 right-2 text-gray-400 hover:text-white">
          <FiX size={20}/>
        </button>

        <h3 className="text-xl font-bold text-white mb-4">Connect your Starknet wallet</h3>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-3 h-3 rounded-full ${localHrWalletIsValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h4 className="text-sm font-medium text-gray-300">HR Wallet Status</h4>
          </div>
          {localHrWalletAddress ? (
            <>
              <p className="text-gray-300 text-sm ml-5">
                Address: <span className="font-mono text-white">{formatAddress(localHrWalletAddress)}</span>
              </p>
              {!localHrWalletIsValid && (
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

        {!localHrWalletAddress && (
          <div className="mb-6 border-t border-gray-700 pt-4">
            <p className="text-gray-300 mb-4">
              Please connect your Starknet wallet to continue.
            </p>
            <WalletConnectButton />
          </div>
        )}

        {localHrWalletAddress && (
          <div className="border-t border-gray-700 pt-4">
            {mintingState !== 'success' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  NFT Metadata URI (ipfs://... or https://...)
                </label>
                <input
                  type="text"
                  value={uri}
                  onChange={e => {
                    setUri(e.target.value);
                    console.debug('[WalletConnectModal] URI changed:', e.target.value);
                  }}
                  placeholder="Enter metadata URI"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={mintingState === 'pending' || mintingState === 'prompt'}
                />
                {!uri.trim() && (
                  <p className="text-xs text-yellow-400 mt-1">Please provide a valid metadata URI.</p>
                )}
              </div>
            )}

            {mintingState === 'success' ? (
              <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                <FiCheckCircle /> Hire NFT minted and saved!
              </div>
            ) : (
              <button
                ref={buttonRef}
                onClick={async () => {
                  setClicked(true);
                  console.debug('[WalletConnectModal] Mint button clicked', { uri: uri.trim() });
                  await onMint(uri.trim());
                }}
                className={`w-full ${
                  canMint && !clicked
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 cursor-not-allowed'
                } text-white font-semibold px-4 py-2 rounded-lg transition flex items-center justify-center`}
                disabled={!canMint || clicked}
              >
                {(mintingState === 'prompt' || mintingState === 'pending' || clicked) && (
                  <>
                    <FiLoader className="animate-spin mr-2" /> {mintingState === 'prompt' ? 'Approve in wallet...' : 'Minting...'}
                  </>
                )}
                {mintingState === 'idle' && canMint && !clicked && 'Mint Hire NFT'}
                {mintingState === 'idle' && !canMint && 'Cannot Mint (Wallet Issues or URI missing)'}
                {mintingState === 'error' && 'Retry Mint'}
              </button>
            )}
            {mintError && (
              <div className="text-red-400 text-xs mt-2">{mintError}</div>
            )}
            {(!localHrWalletIsValid || !devWalletIsValid) && mintingState !== 'success' && (
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

import { useState, useEffect } from "react";
import { useStarknet } from "./StarknetProvider";
import { FaWallet, FaExclamationTriangle, FaUserCircle, FaPlug, FaUnlink } from "react-icons/fa";

interface ConnectWalletProps {
  onConnect: (address: string) => void;
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
  const { 
    address, 
    connectWallet, 
    disconnectWallet, 
    isConnecting, 
    error, 
    networkName,
    balance,
    walletType
  } = useStarknet();
  
  const [showDetails, setShowDetails] = useState(false);

  // Notify parent component when wallet is connected
  useEffect(() => {
    if (address) {
      onConnect(address);
    }
  }, [address, onConnect]);

  const formatAddress = (addr: string) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
  };

  return (
    <div className="mb-4">
      {!address ? (
        <div className="flex flex-col">
          <button 
            className={`btn ${isConnecting ? 'btn-disabled' : 'btn-primary'} flex items-center justify-center gap-2`}
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <FaWallet />
                <span>Connect Starknet Wallet</span>
              </>
            )}
          </button>
          
          <div className="mt-2 text-xs text-gray-400">
            Connect using Argent X, Braavos or other Starknet wallets
          </div>
          
          {error && (
            <div className="mt-3 text-sm text-red-500 flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaUserCircle className="text-xl text-green-400" />
              <div>
                <div className="text-green-400 font-medium">Connected</div>
                <div className="text-xs text-gray-300 font-mono mt-0.5">{formatAddress(address)}</div>
              </div>
            </div>
            <button 
              className="btn btn-sm btn-outline btn-error" 
              onClick={disconnectWallet}
            >
              <FaUnlink className="mr-1" /> Disconnect
            </button>
          </div>
          
          <div className="mt-1 flex justify-between">
            <button
              className="text-xs text-blue-400 hover:text-blue-300 underline"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
            {walletType && (
              <div className="text-xs text-gray-400">
                {walletType}
              </div>
            )}
          </div>
          
          {showDetails && (
            <div className="mt-3 bg-gray-900 rounded-md p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-white">{networkName || "Unknown"}</span>
              </div>
              {balance && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-white">{balance} ETH</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Address:</span>
                <span className="text-white font-mono text-[10px]">{address}</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-2 text-sm text-red-500 flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
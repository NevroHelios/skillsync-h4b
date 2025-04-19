import React, { useState, useEffect } from "react";
import { connect, disconnect } from "get-starknet";
import { encode } from "starknet";

function WalletConnectButton() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletName, setWalletName] = useState("");
  const [wallet, setWallet] = useState("");

  // restore from localStorage on mount
  useEffect(() => {
    const addr = localStorage.getItem("walletAddress");
    const name = localStorage.getItem("walletName");
    if (addr) setWalletAddress(addr);
    if (name) setWalletName(name);
  }, []);

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
        encode
          .removeHexPrefix(getWallet?.selectedAddress ?? "0x")
          .padStart(64, "0")
      );
      setWalletAddress(addr);
      setWalletName(getWallet?.name || "");

      // persist for reload
      localStorage.setItem("walletAddress", addr);
      localStorage.setItem("walletName", getWallet?.name || "");
    } catch (e) {
      // Handle user rejection to install MetaMask / the Starknet Snap.
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
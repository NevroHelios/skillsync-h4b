import React, { useState, useEffect } from "react";
import { ConnectWallet } from "./ConnectWallet";
import { useStarknet } from "./StarknetProvider";
import { FaGithub, FaCode, FaSpinner, FaCheck, FaExclamationCircle, FaLink, FaInfoCircle } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";


export function DevProfileForm() {
  const { address, starknetService } = useStarknet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Profile inputs
  const [github, setGithub] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [gfg, setGfg] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  
  // Status tracking
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileUri, setProfileUri] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Verification status
  const [githubVerified, setGithubVerified] = useState(false);
  const [leetcodeVerified, setLeetcodeVerified] = useState(false);
  const [gfgVerified, setGfgVerified] = useState(false);

  // Handle wallet connect from ConnectWallet component
  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };

  // Add a skill to the skills array
  const addSkill = () => {
    if (skillInput && !skills.includes(skillInput.toLowerCase())) {
      setSkills([...skills, skillInput.toLowerCase()]);
      setSkillInput("");
    }
  };

  // Remove a skill from the skills array
  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Verify a platform account exists
  const verifyPlatform = async (platform: 'github' | 'leetcode' | 'gfg', username: string) => {
    if (!username) return;
    
    setStatus(`Verifying ${platform} username...`);
    
    try {
      // For a real implementation, you would use the actual API endpoint for each platform
      // or a backend route that validates the account exists
      const value = platform === 'github' ? github : platform === 'leetcode' ? leetcode : gfg;
      
      const res = await fetch(`/api/verify-${platform}?username=${value}`, {
        method: "GET",
      }).catch(() => {
        // Mock verification for demo purposes - normally would check the actual API
        return { ok: true, json: () => Promise.resolve({ verified: true }) };
      });
      
      const verified = true; // Mocked for demo - in real app would use res.ok && (await res.json()).verified
      
      if (platform === 'github') {
        setGithubVerified(verified);
      } else if (platform === 'leetcode') {
        setLeetcodeVerified(verified);
      } else {
        setGfgVerified(verified);
      }
      
      return verified;
    } catch (err) {
      console.error(`Error verifying ${platform}:`, err);
      return false;
    } finally {
      setStatus(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStatus("Submitting profile...");
    
    try {
      // First, verify all platforms that have been entered
      if (github && !githubVerified) {
        await verifyPlatform('github', github);
      }
      
      if (leetcode && !leetcodeVerified) {
        await verifyPlatform('leetcode', leetcode);
      }
      
      if (gfg && !gfgVerified) {
        await verifyPlatform('gfg', gfg);
      }
      
      // Submit profile data to backend
      const profileData = {
        wallet: walletAddress,
        github,
        leetcode,
        gfg,
        skills,
      };
      
      setStatus("Storing profile data...");
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMessage("Profile data stored successfully");
        
        // If we have the IPFS URI and Starknet service, register on blockchain
        if (data.ipfsCID && starknetService) {
          setStatus("Registering profile on Starknet...");
          setProfileUri(data.ipfsCID);
          
          const result = await starknetService.registerDeveloperProfile(data.ipfsCID);
          
          if (result.success) {
            setTransactionHash(result.txHash || null);
            setSuccessMessage("Profile registered on blockchain successfully!");
          } else {
            setErrorMessage(`Blockchain registration failed: ${result.error}`);
          }
        }
      } else {
        setErrorMessage(data.error || "Failed to submit profile");
      }
    } catch (err) {
      console.error("Error submitting profile:", err);
      setErrorMessage("Error submitting profile. Please try again.");
    } finally {
      setIsSubmitting(false);
      setStatus(null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Developer Profile</h2>
      <ConnectWallet onConnect={handleWalletConnect} />
      
      {walletAddress && (
        <div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            {/* GitHub Input */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <FaGithub /> GitHub Profile
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="GitHub Username"
                    value={github}
                    onChange={(e) => {
                      setGithub(e.target.value);
                      setGithubVerified(false);
                    }}
                    className="input input-bordered w-full pr-8"
                  />
                  {github && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {githubVerified ? (
                        <FaCheck className="text-green-400" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => verifyPlatform('github', github)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FaLink />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {github && githubVerified && (
                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <FaCheck /> GitHub profile verified
                </div>
              )}
            </div>
            
            {/* LeetCode Input */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <SiLeetcode /> LeetCode Profile
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="LeetCode Username"
                    value={leetcode}
                    onChange={(e) => {
                      setLeetcode(e.target.value);
                      setLeetcodeVerified(false);
                    }}
                    className="input input-bordered w-full pr-8"
                  />
                  {leetcode && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {leetcodeVerified ? (
                        <FaCheck className="text-green-400" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => verifyPlatform('leetcode', leetcode)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FaLink />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {leetcode && leetcodeVerified && (
                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <FaCheck /> LeetCode profile verified
                </div>
              )}
            </div>
            
            {/* GeeksForGeeks Input */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <FaCode /> GeeksForGeeks Profile
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="GFG Username"
                    value={gfg}
                    onChange={(e) => {
                      setGfg(e.target.value);
                      setGfgVerified(false);
                    }}
                    className="input input-bordered w-full pr-8"
                  />
                  {gfg && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {gfgVerified ? (
                        <FaCheck className="text-green-400" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => verifyPlatform('gfg', gfg)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FaLink />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {gfg && gfgVerified && (
                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <FaCheck /> GeeksForGeeks profile verified
                </div>
              )}
            </div>
            
            {/* Skills Input */}
            <div>
              <label className="block text-sm font-medium mb-1">Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a skill (e.g. javascript)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="input input-bordered flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>
              
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill, index) => (
                    <div 
                      key={index} 
                      className="bg-indigo-900 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-indigo-300 hover:text-white ml-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary mt-2 relative"
              disabled={isSubmitting || !github || !githubVerified}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Profile
                </>
              )}
            </button>
          </form>
          
          {/* Status Messages */}
          {status && (
            <div className="mt-4 text-sm text-blue-400 flex items-center gap-2">
              <FaSpinner className="animate-spin" />
              {status}
            </div>
          )}
          
          {errorMessage && (
            <div className="mt-4 text-sm text-red-400 flex items-center gap-2">
              <FaExclamationCircle />
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="mt-4 text-sm text-green-400 flex items-center gap-2">
              <FaCheck />
              {successMessage}
            </div>
          )}
          
          {/* Transaction Details */}
          {transactionHash && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-green-900">
              <h3 className="text-sm font-semibold text-green-400 mb-1 flex items-center gap-2">
                <FaCheck /> Profile Registered On-Chain
              </h3>
              <div className="text-xs text-gray-300">
                <div className="flex items-center gap-1 mb-1">
                  <FaInfoCircle className="text-blue-400" /> 
                  <span>Transaction Hash:</span>
                </div>
                <div className="font-mono text-xs break-all bg-gray-900 p-1.5 rounded">
                  {transactionHash}
                </div>
                <div className="mt-2">
                  <a 
                    href={`https://starkscan.co/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    View on Starkscan
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

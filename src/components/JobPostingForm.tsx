import React, { useState } from "react";
import { ConnectWallet } from "./ConnectWallet";
import { useStarknet } from "./StarknetProvider";
import { FaSpinner, FaCheck, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";

export function JobPostingForm() {
  const { starknetService } = useStarknet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [experience, setExperience] = useState("");
  
  // Status states
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [jobUri, setJobUri] = useState<string | null>(null);

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCompany("");
    setRequiredSkills("");
    setExperience("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("Submitting job post...");
    setErrorMessage(null);
    setSuccessMessage(null);

    const skillsArray = requiredSkills.split(',').map(skill => skill.trim());

    try {
      // Step 1: Submit to backend API
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          title,
          description,
          company,
          skills: skillsArray,
          experience
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(`Job posted successfully to backend!`);
        setJobUri(data.ipfsCID);
        
        // Step 2: If we have a Starknet service and IPFS URI, register on blockchain
        if (data.ipfsCID && starknetService) {
          setStatus("Registering job on Starknet...");
          
          const result = await starknetService.postJob(data.ipfsCID);
          
          if (result.success) {
            setTransactionHash(result.txHash || null);
            setSuccessMessage("Job posted and registered on blockchain successfully!");
            // Reset the form
            resetForm();
          } else {
            setErrorMessage(`Blockchain registration failed: ${result.error}`);
          }
        } else {
          // If we don't have Starknet integration, still reset the form
          resetForm();
        }
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "Failed to post job. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting job post:", err);
      setErrorMessage("Error submitting job post. Please try again.");
    } finally {
      setIsSubmitting(false);
      setStatus(null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Post a Job</h2>
      <ConnectWallet onConnect={handleWalletConnect} />
      
      {walletAddress && (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <input
              type="text"
              placeholder="Job Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input input-bordered"
              required
            />
            
            <input
              type="text"
              placeholder="Company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="input input-bordered"
              required
            />
            
            <textarea
              placeholder="Job Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="textarea textarea-bordered"
              rows={3}
              required
            />
            
            <input
              type="text"
              placeholder="Required Skills (comma separated)"
              value={requiredSkills}
              onChange={e => setRequiredSkills(e.target.value)}
              className="input input-bordered"
              required
            />
            
            <input
              type="text"
              placeholder="Experience Required (e.g. 2+ years)"
              value={experience}
              onChange={e => setExperience(e.target.value)}
              className="input input-bordered"
              required
            />
            
            <button
              type="submit"
              className="btn btn-primary mt-2"
              disabled={isSubmitting || !title || !company || !requiredSkills}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                "Post Job"
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
                <FaCheck /> Job Posted On-Chain
              </h3>
              <div className="text-xs text-gray-300">
                {jobUri && (
                  <div className="mb-2">
                    <div className="font-semibold mb-1">IPFS URI:</div>
                    <div className="font-mono text-xs break-all bg-gray-900 p-1.5 rounded mb-2">
                      {jobUri}
                    </div>
                  </div>
                )}
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
        </>
      )}
    </div>
  );
}
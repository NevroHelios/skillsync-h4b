"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { JobPostClientData, PREDEFINED_TECH_TAGS, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, IJob } from '@/models/Job'; // Adjust path if needed
import { IHRProfile } from '@/models/HRProfile'; // Adjust path if needed
// import Link from 'next/link'; // Keep if you plan to add links
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core"; // Import useConnectors
import { Contract, shortString, AccountInterface } from "starknet"; // IMPORTANT: Import AccountInterface

import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
} from "@starknet-react/core";

// --- Reusable Input Components (Keep as they are) ---
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, id, error, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      id={id}
      {...props}
      className={`w-full px-3 py-2 bg-gray-800 border ${error ? 'border-red-500' : 'border-gray-700'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}
const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, id, error, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <textarea
      id={id}
      rows={6}
      {...props}
      className={`w-full px-3 py-2 bg-gray-800 border ${error ? 'border-red-500' : 'border-gray-700'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly string[];
  error?: string;
}
const SelectField: React.FC<SelectFieldProps> = ({ label, id, options, error, ...props }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <select
        id={id}
        {...props}
        className={`w-full px-3 py-2 bg-gray-800 border ${error ? 'border-red-500' : 'border-gray-700'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <option value="">Select...</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
);

// --- StarkNet contract ABI and address ---
// Ensure this is set in your .env.local file (e.g., NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS=0x...)
const STARKNET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS as string;
if (!STARKNET_CONTRACT_ADDRESS) {
    console.error("Error: NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS is not set in environment variables.");
    // Optionally throw an error or handle it gracefully
}

// --- Minimal ABI for the create_job function ---
// (Ensure this ABI matches your deployed contract)
const minimalAbi = [
  {
    "type": "function",
    "name": "create_job",
    "inputs": [
      {"name": "job_id", "type": "core::felt252"},
      {"name": "job_title", "type": "core::felt252"},
      {"name": "company_name", "type": "core::felt252"},
      {"name": "requirements", "type": "core::felt252"}
    ],
    "outputs": [{"type": "core::integer::u64"}], // Assuming output is token ID (u64)
    "state_mutability": "external"
  }
];

// Helper to safely encode string to felt252 (handles length limits)
function safeEncodeFelt252(str: string): string {
  const MAX_FELT_LEN = 31; // Max chars for shortString encoding
  const truncated = str.length > MAX_FELT_LEN ? str.substring(0, MAX_FELT_LEN) : str;
  try {
    // Ensure the string is ASCII or handle potential encoding errors
    return shortString.encodeShortString(truncated.replace(/[^\x00-\x7F]/g, ""));
  } catch (e) {
    console.error(`Failed to encode string "${truncated}" to felt252:`, e);
    // Provide a default value or handle the error appropriately
    return shortString.encodeShortString("ENCODING_ERR");
  }
}

// Helper to get StarkNet explorer URL (adjust base URL if needed)
const getExplorerUrl = (txHash: string | null): string | null => {
   if (!txHash) return null;
   // Use Voyager for Sepolia testnet (adjust if using mainnet or other testnets)
   // Mainnet: https://voyager.online/tx/
   // Goerli: https://goerli.voyager.online/tx/
   // Sepolia: https://sepolia.voyager.online/tx/
   return `https://sepolia.voyager.online/tx/${txHash}`;
}


// --- Main Post Job Page Component ---
export default function PostJobPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const user = session?.user as SessionUser | undefined;

  const initialFormData: JobPostClientData = {
    title: '',
    company: '',
    location: '',
    description: '',
    techStack: [],
    salaryMin: undefined,
    salaryMax: undefined,
    employmentType: '',
    experienceLevel: '',
  };

  const [formData, setFormData] = useState<JobPostClientData>(initialFormData);
  const [techStackInput, setTechStackInput] = useState('');
  const [submissionState, setSubmissionState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof JobPostClientData | 'techStackInput' | 'form' | 'nft', string>>>({});
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [lastPostedJob, setLastPostedJob] = useState<IJob | null>(null);
  const [hrProfileData, setHrProfileData] = useState<IHRProfile | null>(null);

  // --- StarkNet wallet integration using @starknet-react/core ---
  const { account, address, isConnected, status: accountStatus } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Make connectors available to the entire component (for sidebar buttons)
  const connectors = [braavos(), argent()];

  const [mintingState, setMintingState] = useState<'idle' | 'prompt' | 'pending' | 'success' | 'error'>('idle');
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);


  // --- Authentication & Authorization ---
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated" || (sessionStatus === "authenticated" && user?.role !== 'hr')) {
      toast.warn("Please sign in as an HR user to post jobs.");
      router.replace('/auth/signin?callbackUrl=/hr/post-job');
    }
  }, [session, sessionStatus, user, router]);

  // --- Fetch HR Profile ---
  const fetchHRProfile = useCallback(async () => {
    if (user?.id) {
        setIsFetchingProfile(true);
        setHrProfileData(null); // Reset previous data
        try {
            const response = await fetch('/api/hr-profile');
            if (response.ok) {
                const profile: IHRProfile = await response.json();
                setHrProfileData(profile);
                if (profile?.company && !formData.company) { // Only pre-fill if form field is empty
                    setFormData(prev => ({ ...prev, company: profile.company }));
                }
            } else if (response.status === 404) {
                console.log("HR profile not found, skipping company pre-fill.");
            } else {
                 const errorData = await response.text();
                 console.warn(`Could not fetch HR profile (Status: ${response.status}): ${errorData}`);
                 toast.warn("Could not load company profile details.");
            }
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
             console.error("Error fetching HR profile:", errorMessage, error);
             toast.error("Error loading HR profile.");
        } finally {
             setIsFetchingProfile(false);
        }
    }
  }, [user?.id, formData.company]); // Add formData.company dependency

  useEffect(() => {
      if (sessionStatus === "authenticated" && user?.role === 'hr') {
          fetchHRProfile();
      }
      // Don't fetch profile if form already has company (e.g., after failed submission)
  }, [sessionStatus, user, fetchHRProfile]);


  // --- Input Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
    // Clear specific field error and general form errors on change
    setErrors(prev => ({ ...prev, [name as keyof JobPostClientData]: undefined, form: undefined, nft: undefined }));
    if (submissionState === 'success') {
        resetSuccessState(); // Reset if editing after success
    }
  };

  const handleTechStackInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTechStackInput(e.target.value);
    setErrors(prev => ({ ...prev, techStackInput: undefined, techStack: undefined }));
     if (submissionState === 'success') {
        resetSuccessState();
     }
  };

  const addTechTag = (tagToAdd: string) => {
     const newTag = tagToAdd.trim().replace(/,/g, ''); // Remove commas
     if (newTag && !formData.techStack.some(tag => tag.toLowerCase() === newTag.toLowerCase())) {
        setFormData(prev => ({ ...prev, techStack: [...prev.techStack, newTag] }));
        setTechStackInput('');
        // Clear tech stack errors
        setErrors(prev => ({ ...prev, techStack: undefined, techStackInput: undefined }));
     } else if (!newTag) {
         setErrors(prev => ({ ...prev, techStackInput: 'Tag cannot be empty.' }));
     } else {
          setErrors(prev => ({ ...prev, techStackInput: `'${newTag}' is already added.` }));
     }
     if (submissionState === 'success') {
        resetSuccessState();
     }
  };

  const handleAddTechTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addTechTag(techStackInput);
      }
  };

  const handleAddTechTagClick = () => {
      addTechTag(techStackInput);
  };

  const removeTechTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(tag => tag !== tagToRemove),
    }));
    // Clear techStack error if list becomes non-empty after removal, otherwise keep it if list becomes empty
    if (formData.techStack.length > 1) {
        setErrors(prev => ({ ...prev, techStack: undefined }));
    }
     if (submissionState === 'success') {
        resetSuccessState();
     }
  };

  // --- Reset Success State ---
  const resetSuccessState = () => {
      setSubmissionState('idle');
      setLastPostedJob(null);
      setMintingState('idle');
      setMintError(null);
      setMintTxHash(null);
      // Don't reset form data here, allow editing or clear via "Post Another" button
  }

  // --- Form Validation ---
   const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof JobPostClientData | 'techStack' | 'form' | 'nft', string>> = {};
        let isValid = true;

        if (!formData.title.trim()) { newErrors.title = 'Job title is required.'; isValid = false; }
        if (!formData.company.trim()) { newErrors.company = 'Company name is required.'; isValid = false; }
        if (!formData.location.trim()) { newErrors.location = 'Location is required.'; isValid = false; }
        if (!formData.description.trim()) { newErrors.description = 'Job description is required.'; isValid = false; }
        if (formData.techStack.length === 0) { newErrors.techStack = 'Add at least one tech stack tag.'; isValid = false; }

        const min = formData.salaryMin;
        const max = formData.salaryMax;
        if (min !== undefined && min < 0) { newErrors.salaryMin = 'Salary cannot be negative.'; isValid = false; }
        if (max !== undefined && max < 0) { newErrors.salaryMax = 'Salary cannot be negative.'; isValid = false; }
        if (min !== undefined && max !== undefined && min > max) {
             newErrors.salaryMax = 'Max salary must be >= min salary.'; isValid = false;
        }

        setErrors(newErrors);
        return isValid;
   };


  // --- Mint NFT with wallet ---
  const handleMintNFT = async (job: IJob) => {
    setMintingState('prompt');
    setMintError(null);
    setMintTxHash(null);

    // 1. Check if Contract Address is configured
    if (!STARKNET_CONTRACT_ADDRESS) {
        setMintingState('error');
        const errorMsg = "StarkNet contract address is not configured.";
        setMintError(errorMsg);
        toast.error(errorMsg);
        return;
    }

    // 2. Check Wallet Connection and Account Availability
    if (!isConnected || !account) {
      setMintingState('error');
      const errorMsg = "StarkNet wallet not connected. Please connect your wallet first.";
      setMintError(errorMsg);
      toast.warn(errorMsg);
      // Optionally prompt connection again:
      // if (connectors.length > 0) {
      //   await connect({ connector: connectors[0] });
      // }
      return;
    }

    // 3. Proceed with Minting
    try {
      // Prepare calldata
      const jobIdFelt = safeEncodeFelt252(job._id.toString());
      const jobTitleFelt = safeEncodeFelt252(job.title);
      const companyNameFelt = safeEncodeFelt252(job.company);
      const requirementsFelt = safeEncodeFelt252(`On-Platform ID: ${job._id.toString().substring(0,10)}`); // Keep it short

      // Create contract instance **USING the account from useAccount**
      // It directly conforms to AccountInterface required by Contract
      const contract = new Contract(minimalAbi, STARKNET_CONTRACT_ADDRESS, account); // Correct!

      // Send transaction
      setMintingState('pending');
      toast.info("Sending transaction to StarkNet... Please approve in your wallet.");

      // Use invoke() which handles nonce and signature automatically via the connected account
      const txResponse = await contract.invoke("create_job", [
        jobIdFelt,
        jobTitleFelt,
        companyNameFelt,
        requirementsFelt
      ]);
      // Note: `invoke` returns a response with transaction_hash

      console.log("StarkNet Tx Response:", txResponse);
      setMintTxHash(txResponse.transaction_hash);

      // Inform user TX is sent, confirmation might take time
      setMintingState('success');
      toast.success("NFT mint transaction sent successfully! It may take a few moments to confirm on-chain.");

      // OPTIONAL: Update job in DB with Tx Hash (e.g., via another API call)
      // try {
      //    await fetch(`/api/jobs/${job._id}/update-tx`, {
      //      method: 'POST',
      //      headers: { 'Content-Type': 'application/json' },
      //      body: JSON.stringify({ starknetTxHash: txResponse.transaction_hash }),
      //    });
      //   setLastPostedJob(prev => prev ? { ...prev, starknetTxHash: txResponse.transaction_hash } : null); // Update local state too
      // } catch (updateError) {
      //   console.error("Failed to update job with tx hash:", updateError);
      //   toast.warn("Job posted and NFT mint sent, but failed to save transaction hash to DB.");
      // }

    } catch (error) {
      console.error("StarkNet NFT Minting Error:", error);
      setMintingState('error');

      let errorMessage = "Failed to mint NFT.";
      if (error instanceof Error) {
          // Check for common user rejection errors
          if (error.message.includes('User abort') || error.message.includes('User rejected') || error.message.includes('CallArgumentsRejected')) {
              errorMessage = "Transaction rejected by user in wallet.";
              toast.warn(errorMessage);
          } else {
              errorMessage = error.message;
              toast.error(`NFT minting failed: ${errorMessage}`);
          }
      } else if (typeof error === 'string') {
          errorMessage = error;
          toast.error(`NFT minting failed: ${errorMessage}`);
      } else {
          toast.error(errorMessage); // Generic message
      }
      setMintError(errorMessage);
    }
  };

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors
    setLastPostedJob(null);
    setSubmissionState('idle'); // Reset state

    if (!validateForm()) {
        toast.error("Please fix the errors in the form.");
        setSubmissionState('error');
        // Optional: focus first error field
        const firstErrorKey = Object.keys(errors).find(key => errors[key as keyof typeof errors]);
        if (firstErrorKey) {
            const elementId = firstErrorKey === 'techStack' ? 'techStackInput' : firstErrorKey;
            document.getElementById(elementId)?.focus();
        }
        return;
    }

    setSubmissionState('saving'); // Indicate saving to DB
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Check response content type before parsing JSON
      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
          result = await response.json();
      } else {
           // Handle non-JSON responses (e.g., server errors returning HTML)
           const errorText = await response.text();
           throw new Error(`Server returned non-JSON response (Status ${response.status}): ${errorText.substring(0, 200)}...`);
      }

      if (!response.ok) {
        // Handle specific API error structure if available
        const apiErrorMessage = result?.error || result?.message || `API Error (Status: ${response.status})`;
        const details = result?.details ? ` (${result.details.join(', ')})` : '';
        toast.error(`Failed to post job: ${apiErrorMessage}${details}`);
        setErrors(prev => ({ ...prev, form: `API Error: ${apiErrorMessage}` }));
        setSubmissionState('error');
      } else {
        // Success!
        const postedJob: IJob = result;
        setLastPostedJob(postedJob); // Store the successfully posted job
        toast.success('Job posted successfully!');
        // Don't reset form immediately, show success panel
        setSubmissionState('success');
        // Optionally reset form fields partially (keep company?) or fully via "Post Another"
        // setFormData(initialFormData); // Reset form fields
        // setTechStackInput('');
        // fetchHRProfile(); // Re-fetch/reset company
      }
    } catch (error) {
      console.error("Error posting job:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown submission error occurred.";
      toast.error(`Failed to post job: ${errorMessage}`);
      setErrors(prev => ({ ...prev, form: `Submission Error: ${errorMessage}` }))
      setSubmissionState('error');
    }
  };

  // Determine button state and text for the main form submission
  const getButtonState = (): { text: string; disabled: boolean } => {
     const isProcessing = submissionState === 'saving'; // Only disable during DB save
     let text = 'Post Job';
     if (submissionState === 'saving') text = 'Saving Job...';
     // Success state is handled by the success panel, button hides
     if (submissionState === 'error') text = 'Retry Submission';

     return { text, disabled: isProcessing };
  }
  const { text: buttonText, disabled: isButtonDisabled } = getButtonState();

  // --- Loading and Access Control ---
  if (sessionStatus === "loading" || (sessionStatus === "authenticated" && user?.role === 'hr' && isFetchingProfile)) {
    return <div className="flex justify-center items-center h-screen"><div className="text-gray-400 text-xl">Loading...</div></div>;
  }
   if (sessionStatus !== "authenticated" || user?.role !== 'hr') {
     // Redirect is handled by useEffect, show message while redirecting
     return <div className="p-6 text-center text-red-500">Access Denied. Redirecting to sign-in...</div>;
   }

  

  // --- Component Render ---
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl"> {/* Increased max-width */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">

        {/* --- Sidebar --- */}
        <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0">
            <div className="sticky top-6 bg-gray-800 rounded-lg p-4 text-gray-100 shadow-lg space-y-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2 border-b border-gray-600 pb-1">Profile</h2>
                    {user && (
                        <div className='text-sm space-y-1'>
                            <p><span className='font-medium text-gray-400'>Name:</span> {user.name || 'N/A'}</p>
                            <p><span className='font-medium text-gray-400'>Email:</span> {user.email || 'N/A'}</p>
                        </div>
                    )}
                    {hrProfileData?.company && <p className='text-sm mt-1'><span className='font-medium text-gray-400'>Company:</span> {hrProfileData.company}</p>}
                    {isFetchingProfile && !hrProfileData && <p className='text-sm text-gray-400 italic mt-1'>Loading profile...</p>}
                </div>

                <div className="mt-4">
                    <h2 className="text-lg font-semibold mb-2 border-b border-gray-600 pb-1">StarkNet Wallet</h2>
                    { accountStatus === 'loading' && <p className='text-sm text-gray-400 italic'>Loading wallet state...</p> }

                    { accountStatus !== 'loading' && isConnected && account ? (
                        <div className='text-sm space-y-2'>
                            <p>
                                <span className='font-medium text-gray-400'>Status:</span> <span className='text-green-400'>Connected</span>
                            </p>
                            <p>
                                <span className='font-medium text-gray-400'>Wallet:</span> {account.provider?.id ?? 'Unknown'} {/* Display wallet ID */}
                            </p>
                            <p className="break-all">
                                <span className='font-medium text-gray-400'>Address:</span> {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'N/A'}
                            </p>
                            <button
                            onClick={() => disconnect()}
                            className="mt-2 w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition"
                            >
                            Disconnect
                            </button>
                        </div>
                        ) : (
                        <div className='text-sm space-y-2'>
                            <p>
                                <span className='font-medium text-gray-400'>Status:</span> <span className='text-yellow-400'>Disconnected</span>
                            </p>
                            {connectors.length > 0 ? (
                                connectors.map((connector) => (
                                    <button
                                    key={connector.id}
                                    onClick={() => connect({ connector })}
                                    disabled={!connector.available()}
                                    className={`mt-2 w-full px-3 py-1.5 rounded text-white text-sm font-medium transition ${
                                        !connector.available()
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                    >
                                    Connect {connector.name}
                                    {/* {!connector.available() && ' (Not Available)'} */}
                                    </button>
                                ))
                            ) : (
                                <p className='text-xs text-gray-400'>No StarkNet wallet connector found. Please install ArgentX or Braavos.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </aside>

        {/* --- Main Content Area (Job Form) --- */}
        <main className="md:w-3/4 lg:w-4/5">
          <div className="bg-gray-900 text-gray-100 rounded-lg shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold mb-6 text-indigo-400 border-b border-gray-700 pb-3">
              Post a New Job Opening
            </h1>

            {/* --- Success Message & Minting Area --- */}
            {submissionState === 'success' && lastPostedJob && (
                <div className="mb-6 p-4 border border-green-600 bg-green-900/30 rounded-lg text-center space-y-4">
                    <div>
                        <p className="text-lg font-semibold text-green-400">Job Posted Successfully!</p>
                        <p className="text-sm mt-1">
                            <span className="font-medium">{lastPostedJob.title}</span> at <span className="font-medium">{lastPostedJob.company}</span>
                            <br /> (ID: {lastPostedJob._id.toString()})
                        </p>
                    </div>

                    {/* --- NFT Minting Section --- */}
                    <div className="pt-3 border-t border-gray-700/50">
                        <h2 className="text-md font-semibold text-indigo-300 mb-2">Mint Job NFT on StarkNet</h2>
                        {!isConnected && (
                            <p className="text-sm text-yellow-400 mb-2">Please connect your StarkNet wallet to mint the NFT.</p>
                        )}

                        {isConnected && account && mintingState === 'idle' && (
                            <button
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleMintNFT(lastPostedJob)}
                            disabled={!STARKNET_CONTRACT_ADDRESS} // Disable if contract address missing
                            >
                             {STARKNET_CONTRACT_ADDRESS ? 'Mint NFT for this Job' : 'Minting Disabled (No Address)'}
                            </button>
                        )}

                        {/* Minting status messages */}
                        {mintingState === 'prompt' && (
                        <div className="mt-2 text-indigo-300 animate-pulse">Please approve the transaction in your wallet...</div>
                        )}
                        {mintingState === 'pending' && (
                        <div className="mt-2 text-indigo-300">
                            Transaction sent. Waiting for confirmation...
                            {mintTxHash && getExplorerUrl(mintTxHash) && (
                            <a
                                href={getExplorerUrl(mintTxHash)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-1 text-indigo-400 hover:underline text-sm"
                            >
                                View on StarkNet Explorer
                            </a>
                            )}
                        </div>
                        )}
                        {mintingState === 'success' && (
                        <div className="mt-2 text-green-400">
                            NFT Mint Transaction Sent!
                            {mintTxHash && getExplorerUrl(mintTxHash) && (
                            <a
                                href={getExplorerUrl(mintTxHash)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-1 text-indigo-400 hover:underline text-sm"
                            >
                                View Transaction Details
                            </a>
                            )}
                        </div>
                        )}
                        {mintingState === 'error' && mintError && (
                        <div className="mt-2 p-2 bg-red-900/40 border border-red-700 rounded">
                            <p className="text-red-400 text-sm font-medium">NFT Minting Failed</p>
                            <p className="text-red-300 text-xs mt-1">{mintError}</p>
                            {isConnected && account && ( // Allow retry only if connected
                                <button
                                    className="mt-2 px-3 py-1 bg-indigo-700 hover:bg-indigo-800 rounded text-white text-xs transition"
                                    onClick={() => handleMintNFT(lastPostedJob)}
                                >
                                    Retry Mint
                                </button>
                             )}
                        </div>
                        )}
                    </div>
                    {/* --- End NFT Minting Section --- */}

                    <button
                        onClick={() => {
                            // Reset everything for a new post
                            setSubmissionState('idle');
                            setLastPostedJob(null);
                            setFormData(initialFormData); // Clear form
                            setTechStackInput('');
                            setErrors({});
                            setMintingState('idle');
                            setMintError(null);
                            setMintTxHash(null);
                            fetchHRProfile(); // Re-fetch profile (will pre-fill company if empty)
                        }}
                        className="mt-3 px-5 py-2 bg-green-700 hover:bg-green-800 rounded text-white text-sm font-medium transition"
                    >
                        Post Another Job
                    </button>
                </div>
            )}

            {/* --- Form Area (Hide on success) --- */}
            {submissionState !== 'success' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Job Info */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Job Title *" id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Senior StarkNet Engineer" maxLength={150} required disabled={isButtonDisabled} error={errors.title} />
                    <InputField label="Company Name *" id="company" name="company" value={formData.company} onChange={handleInputChange} placeholder="Your company's name" maxLength={100} required disabled={isButtonDisabled || isFetchingProfile} error={errors.company} />
                </div>
                 <InputField label="Location *" id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g., Remote, London, UK, Zug" maxLength={100} required disabled={isButtonDisabled} error={errors.location} />

                {/* Job Details */}
                <TextAreaField label="Job Description (JD) *" id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the role, responsibilities, key qualifications, stack, and company culture..." required disabled={isButtonDisabled} error={errors.description} />

                 {/* Tech Stack */}
                <div>
                    <label htmlFor="techStackInput" className="block text-sm font-medium text-gray-300 mb-1">Tech Stack / Skills * <span className='text-xs text-gray-400'>(Type and press Enter/Comma or click 'Add Tag')</span></label>
                    <div className="flex items-stretch gap-2 mb-2">
                        <input type="text" id="techStackInput" value={techStackInput} onChange={handleTechStackInputChange} onKeyDown={handleAddTechTagKey} placeholder="e.g., Cairo, StarkNet, Rust, Docker" className={`flex-grow px-3 py-2 bg-gray-800 border ${errors.techStackInput || errors.techStack ? 'border-red-500' : 'border-gray-700'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60`} disabled={isButtonDisabled} />
                        <button type="button" onClick={handleAddTechTagClick} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white transition text-sm font-medium shrink-0 disabled:opacity-60 disabled:cursor-not-allowed" disabled={isButtonDisabled || !techStackInput.trim()}>Add Tag</button>
                    </div>
                    {/* Combined error display */}
                    {(errors.techStackInput || errors.techStack) && <p className="mt-1 text-xs text-red-400">{errors.techStackInput || errors.techStack}</p>}
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                        {formData.techStack.map((tag) => (
                            <span key={tag} className="flex items-center bg-gray-700 text-indigo-300 text-sm font-medium px-2.5 py-1 rounded-full">
                            {tag}
                            <button type="button" onClick={() => removeTechTag(tag)} className="ml-1.5 text-gray-400 hover:text-red-400 focus:outline-none disabled:opacity-50" aria-label={`Remove ${tag}`} disabled={isButtonDisabled}>×</button>
                            </span>
                        ))}
                    </div>
                    {/* Predefined Tags */}
                     <div className="mt-3 pt-2 border-t border-gray-700/50">
                         <p className="text-xs text-gray-400 mb-2">Add common tags:</p>
                         <div className="flex flex-wrap gap-2">
                            {PREDEFINED_TECH_TAGS
                                .filter(tag => !formData.techStack.some(existing => existing.toLowerCase() === tag.toLowerCase()))
                                .map(tag => (
                                    <button type="button" key={tag} onClick={() => addTechTag(tag)} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed" disabled={isButtonDisabled}>+ {tag}</button>
                                ))
                            }
                         </div>
                     </div>
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-700">
                    <SelectField label="Employment Type" id="employmentType" name="employmentType" value={formData.employmentType} onChange={handleInputChange} options={EMPLOYMENT_TYPES} disabled={isButtonDisabled} error={errors.employmentType} />
                    <SelectField label="Experience Level" id="experienceLevel" name="experienceLevel" value={formData.experienceLevel} onChange={handleInputChange} options={EXPERIENCE_LEVELS} disabled={isButtonDisabled} error={errors.experienceLevel} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Salary Range - Minimum ($/year)" id="salaryMin" name="salaryMin" type="number" value={formData.salaryMin ?? ''} onChange={handleInputChange} placeholder="e.g., 90000" min="0" step="1000" disabled={isButtonDisabled} error={errors.salaryMin} />
                    <InputField label="Salary Range - Maximum ($/year)" id="salaryMax" name="salaryMax" type="number" value={formData.salaryMax ?? ''} onChange={handleInputChange} placeholder="e.g., 150000" min="0" step="1000" disabled={isButtonDisabled} error={errors.salaryMax} />
                </div>

                {/* --- Form-level Submission Error Area --- */}
                 {errors.form && (
                     <div className="text-sm text-red-400 text-center bg-red-900/30 p-3 rounded border border-red-700">
                         <p>{errors.form}</p>
                     </div>
                )}
                 <div className="flex justify-end pt-5">
                    <button
                    type="submit"
                    className={`px-6 py-2 rounded text-white font-medium transition ${isButtonDisabled ? 'bg-gray-500 opacity-60 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={isButtonDisabled}
                    >
                    {buttonText}
                    </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
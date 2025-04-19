'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { FiUser, FiMail, FiFileText, FiCalendar, FiEdit, FiCheck, FiX, FiClock, FiLoader, FiArrowLeft, FiChevronDown, FiChevronUp, FiExternalLink } from 'react-icons/fi';
import { FaStar, FaCodeBranch, FaTrophy } from 'react-icons/fa';
import DomainScoresHeader from '@/components/profile/DomainScoresHeader';
import { APPLICATION_STATUS, ApplicationStatus } from '@/models/JobApplication'; // Import status constants
import { useStarknet } from "@/components/StarknetProvider"; // Replace useAccount with useStarknet
import { Contract, stark } from "starknet";
import { Buffer } from 'buffer'; // If using Buffer for encoding
import WalletConnectModal from '@/components/WalletConnectModal';
import WalletConnectButton from '@/components/WalletConnectButton';
import { connect } from 'get-starknet';

// Interfaces matching the data structure from the API
interface DomainScoreData {
  score: number;
  repos?: string[];
  lastUpdated?: Date | string;
}
type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud" | "DSA" | string;

interface Applicant {
  _id: string; // Application ID
  userId: string;
  coverLetter: string;
  resume?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
    photo?: string;
  };
  profile?: {
    bio?: string;
    skills?: string[];
    github?: string;
    leetcode?: string;
    gfg?: string;
    scores?: { [key in Domain]?: DomainScoreData | number | null };
    leetCodeStats?: {
      totalSolved?: number;
      acceptanceRate?: number;
      ranking?: number;
    } | null;
    gfgStats?: {
      info?: {
        codingScore?: number;
        totalProblemsSolved?: number;
      }
    } | null;
    starknetAddress?: string;
  } | null;
  hireNftUri?: string;
  hireNftTxHash?: string;
  starknetAddress?: string; // Add starknetAddress at root level
}

// --- FIX: Update ABI to match contract entrypoint name and order ---
// Your contract entrypoint is "mint_hire_nft", not "hire_developer".
// Also, the ABI must match the order and names in your contract.
const hireNftMinimalAbi = [
  {
    "type": "function",
    "name": "mint_hire_nft",
    "inputs": [
      { "name": "developer", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "job_id", "type": "core::felt252" },
      { "name": "company_name", "type": "core::felt252" },
      { "name": "job_title", "type": "core::felt252" },
      { "name": "uri", "type": "core::felt252" }
    ],
    "outputs": [],
    "state_mutability": "external"
  }
];

const safeEncodeFelt252 = (str: string): string => {
  // Only allow up to 31 ASCII chars for felt252 short string encoding
  // If not ASCII or too long, return empty string (let contract handle error)
  if (!/^[\x00-\x7F]*$/.test(str)) {
    console.warn(`[safeEncodeFelt252] String "${str}" contains non-ASCII chars, not encoding.`);
    return '';
  }
  if (str.length > 31) {
    console.warn(`[safeEncodeFelt252] String "${str}" is too long for felt252 encoding. Truncating.`);
    str = str.substring(0, 31);
  }
  const hex = Buffer.from(str, 'utf8').toString('hex');
  console.debug(`[safeEncodeFelt252] Encoded "${str}" to felt: 0x${hex}`);
  return '0x' + hex;
};

const getExplorerUrl = (txHash: string): string | null => {
  if (!txHash) return null;
  return `https://voyager.online/tx/${txHash}`;
};

// Improved StarkNet address validation (accepts any non-zero, valid hex string with 0x prefix, 3-66 chars)
const isValidStarknetAddress = (address: string | undefined | null): boolean => {
  if (!address) return false;
  if (typeof address !== "string") return false;
  if (!address.startsWith('0x')) return false;
  const stripped = address.slice(2);
  if (stripped.length < 1 || stripped.length > 64) return false;
  if (!/^[0-9a-fA-F]+$/.test(stripped)) return false;
  if (/^0+$/.test(stripped)) return false;
  return true;
};

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [hireMintingState, setHireMintingState] = useState<'idle' | 'prompt' | 'pending' | 'success' | 'error'>('idle');
  const [hireMintError, setHireMintError] = useState<string | null>(null);
  const [hireMintTxHash, setHireMintTxHash] = useState<string | null>(null);
  const [processingHireMintId, setProcessingHireMintId] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [pendingApplicationForWallet, setPendingApplicationForWallet] = useState<Applicant | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);

  const { account } = useStarknet();

  const jobId = params.id as string;

  // Add state for HR to input company name, job title, and job id (like in post-job NFT mint)
  const [hrCompanyName, setHrCompanyName] = useState('');
  const [hrJobTitle, setHrJobTitle] = useState('');
  const [hrJobId, setHrJobId] = useState('');

  // Fix: Always get the wallet address from the correct source
  const getHrWalletAddress = () => {
    if (address && isValidStarknetAddress(address)) return address;
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("walletAddress");
      if (local && isValidStarknetAddress(local)) return local;
    }
    return null;
  };

  const hrWalletAddress = getHrWalletAddress();
  const hrWalletIsValid = Boolean(hrWalletAddress && isValidStarknetAddress(hrWalletAddress));

  // --- FIX: Always persist the applicant's wallet address in the modal ---
  // We keep a separate state for the applicant's wallet address to avoid it vanishing when the modal closes or state resets.
  const [modalApplicantAddress, setModalApplicantAddress] = useState<string>("");

  // When opening the modal, always set the modalApplicantAddress from the applicant's profile
  useEffect(() => {
    if (isWalletModalOpen && pendingApplicationForWallet) {
      // Always use the profile address (never the root)
      setModalApplicantAddress(pendingApplicationForWallet.profile?.starknetAddress || "");
    }
    // Don't clear modalApplicantAddress on close, so it persists during minting
  }, [isWalletModalOpen, pendingApplicationForWallet]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (authStatus === 'loading') return;

      if (authStatus === 'unauthenticated' || (authStatus === 'authenticated' && (session?.user as any)?.role !== 'hr')) {
        toast.error('Access denied. HR role required.');
        router.push('/');
        return;
      }

      if (authStatus === 'authenticated' && jobId) {
        setLoading(true);
        setError(null);
        try {
          const [jobDetailsResponse, applicantsResponse] = await Promise.all([
            fetch(`/api/jobs/public/${jobId}`),
            fetch(`/api/applications/job/${jobId}`)
          ]);

          if (!jobDetailsResponse.ok) {
            throw new Error('Failed to fetch job details.');
          }
          const jobData = await jobDetailsResponse.json();
          setJobDetails(jobData);
          setJobTitle(jobData.title);

          if (!applicantsResponse.ok) {
            if (applicantsResponse.status === 404) {
              setError('Job not found or you do not have permission to view its applicants.');
              toast.error('Job not found or permission denied.');
              setApplicants([]);
            } else {
              const errorData = await applicantsResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to fetch applicants: ${applicantsResponse.statusText}`);
            }
          } else {
            const applicantsData: Applicant[] = await applicantsResponse.json();
            const applicantsWithPlaceholderAddress = applicantsData.map(app => ({
              ...app,
              starknetAddress: app.profile?.starknetAddress || "0x0000000000000000000000000000000000000000000000000000000000000001"
            }));
            setApplicants(applicantsWithPlaceholderAddress);
          }

        } catch (error: any) {
          console.error('Error fetching data:', error);
          setError(`Failed to load data: ${error.message}`);
          toast.error(`Failed to load data: ${error.message}`);
          setApplicants([]);
          setJobDetails(null);
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuthAndFetch();
  }, [jobId, authStatus, session, router]);

  // Helper function to check the wallet connection
  const checkWalletConnection = (applicant: Applicant) => {
    // Only check for account and valid address
    if (!account || !hrWalletIsValid) {
      setPendingApplicationForWallet(applicant);
      setIsWalletModalOpen(true);
      return false;
    }
    return true;
  };

  const handleMintHireNFT = async (
    applicant: Applicant,
    uri: string,
    companyNameOverride?: string,
    jobTitleOverride?: string,
    jobIdOverride?: string
  ) => {
    console.debug('[handleMintHireNFT] called', {
      applicant,
      uri,
      companyNameOverride,
      jobTitleOverride,
      jobIdOverride,
      hrWalletAddress,
      hrWalletIsValid,
      account,
      contractAddress: process.env.NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS_HIRE,
    });

    if (!jobDetails) {
      toast.error("Job details not loaded. Cannot mint.");
      console.error('[handleMintHireNFT] jobDetails missing');
      return;
    }
    if (!uri || !uri.trim()) {
      toast.error("Please provide a valid metadata URI before minting.");
      setHireMintError("Metadata URI is required.");
      setHireMintingState('error');
      console.error('[handleMintHireNFT] URI missing');
      return;
    }

    const hireContractAddress = process.env.NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS_HIRE;
    console.debug('[handleMintHireNFT] contract address', hireContractAddress);
    if (!hireContractAddress) {
      setHireMintingState('error');
      const errorMsg = "Hire NFT contract address is not configured.";
      setHireMintError(errorMsg);
      toast.error(errorMsg);
      console.error('[handleMintHireNFT] contract address missing');
      return;
    }

    // --- FIX: Always use the applicant's wallet address from the profile, not the root object ---
    // (Your backend puts the wallet address in profile.starknetAddress, not at root)
    let developerAddress = applicant.profile?.starknetAddress;
    if (!developerAddress || !isValidStarknetAddress(developerAddress)) {
      setHireMintingState('error');
      const errorMsg = `Applicant wallet address is missing or invalid. The applicant must connect their wallet in their profile before you can mint.`;
      setHireMintError(errorMsg);
      toast.error(errorMsg);
      console.error('[handleMintHireNFT] No valid applicant address:', developerAddress);
      return;
    }

    let usedAccount = account;
    if (!usedAccount) {
      try {
        const starknet = await connect();
        await starknet?.enable({ starknetVersion: "v4" });
        setProvider(starknet.account);
        setAddress(starknet.selectedAddress);
        setIsConnected(true);
        usedAccount = starknet.account;
        console.log('[handleMintHireNFT] Connected account from Braavos/ArgentX:', usedAccount);
      } catch (err) {
        setHireMintingState('error');
        setHireMintError("Failed to connect to wallet. Please try again.");
        toast.error("Failed to connect to wallet.");
        return;
      }
    }
    if (!usedAccount) {
      setHireMintingState('error');
      setHireMintError("No StarkNet account found. Please reconnect your wallet.");
      toast.error("No StarkNet account found. Please reconnect your wallet.");
      return;
    }

    const jobIdToUse = jobIdOverride || jobId;
    const companyNameToUse = companyNameOverride || jobDetails.company;
    const jobTitleToUse = jobTitleOverride || jobDetails.title;

    setPendingApplicationForWallet(null);
    setProcessingHireMintId(applicant._id);
    setHireMintingState('prompt');
    setHireMintError(null);
    setHireMintTxHash(null);

    try {
      console.debug('[handleMintHireNFT] calldata (raw)', {
        developerAddress,
        jobIdToUse,
        companyNameToUse,
        jobTitleToUse,
        uri: uri.trim(),
      });

      const jobIdFelt = safeEncodeFelt252(jobIdToUse);
      const companyNameFelt = safeEncodeFelt252(companyNameToUse);
      const jobTitleFelt = safeEncodeFelt252(jobTitleToUse);
      const metadataUri = uri.trim();
      const uriFelt = safeEncodeFelt252(metadataUri);

      console.debug('[handleMintHireNFT] calldata (felt252)', {
        developerAddress,
        jobIdFelt,
        companyNameFelt,
        jobTitleFelt,
        uriFelt,
      });

      if (!jobIdFelt || !companyNameFelt || !jobTitleFelt || !uriFelt) {
        throw new Error("One or more fields are invalid for felt252 encoding. Please check your inputs.");
      }

      console.debug('[handleMintHireNFT] Creating contract instance', {
        abi: hireNftMinimalAbi,
        address: hireContractAddress,
        usedAccount,
      });

      const contract = new Contract(hireNftMinimalAbi, hireContractAddress, usedAccount);
      if (!contract || !contract.providerOrAccount) {
        throw new Error("Failed to create contract instance. Check contract address and wallet connection.");
      }

      console.log('[handleMintHireNFT] Contract instance:', contract);

      setHireMintingState('pending');
      toast.info("Sending Hire NFT transaction... Please approve in your wallet.");

      console.debug('[handleMintHireNFT] Invoking mint_hire_nft', {
        developerAddress,
        jobIdFelt,
        companyNameFelt,
        jobTitleFelt,
        uriFelt,
      });

      const txResponse = await contract.invoke("mint_hire_nft", [
        developerAddress,
        jobIdFelt,
        companyNameFelt,
        jobTitleFelt,
        uriFelt
      ]);

      console.debug('[handleMintHireNFT] Tx Response', txResponse);

      if (!txResponse || !txResponse.transaction_hash) {
        throw new Error("No transaction hash returned from contract.invoke. Transaction may have failed.");
      }

      setHireMintTxHash(txResponse.transaction_hash);

      setHireMintingState('success');
      toast.success("Hire NFT transaction sent! Saving details...");

      try {
        console.debug('[handleMintHireNFT] Saving Hire NFT details to backend', {
          applicantId: applicant._id,
          metadataUri,
          txHash: txResponse.transaction_hash,
        });

        const updateResponse = await fetch(`/api/applications/${applicant._id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'accepted',
            hireNftUri: metadataUri,
            hireNftTxHash: txResponse.transaction_hash
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || `Failed to save Hire NFT details: ${updateResponse.statusText}`);
        }

        setApplicants(prevApplicants =>
          prevApplicants.map(app =>
            app._id === applicant._id
              ? {
                ...app,
                status: 'accepted',
                hireNftUri: metadataUri,
                hireNftTxHash: txResponse.transaction_hash,
                updatedAt: new Date().toISOString()
              }
              : app
          )
        );
        toast.success('Applicant status updated and Hire NFT details saved!');
        setHireMintingState('idle');

      } catch (dbError: any) {
        console.error("Error saving Hire NFT details to DB:", dbError);
        setHireMintingState('error');
        setHireMintError(`Transaction sent (${txResponse.transaction_hash.substring(0, 8)}...), but failed to save details to DB: ${dbError.message}`);
        toast.error(`Hire NFT Transaction sent, but failed to save details: ${dbError.message}`);
      }

    } catch (error: any) {
      console.error("StarkNet Hire NFT Minting Error:", error);
      setHireMintingState('error');
      let errorMessage = "Failed to mint Hire NFT.";
      if (error instanceof Error) {
        if (error.message.includes('User abort') || error.message.includes('User rejected') || error.message.includes('CallArgumentsRejected')) {
          errorMessage = "Transaction rejected by user in wallet.";
          toast.warn(errorMessage);
        } else {
          errorMessage = error.message;
          toast.error(`Hire NFT minting failed: ${errorMessage}`);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
        toast.error(`Hire NFT minting failed: ${errorMessage}`);
      } else {
        toast.error(errorMessage);
      }
      setHireMintError(errorMessage);
    } finally {
      setProcessingHireMintId(null);
      console.debug('[handleMintHireNFT] finished');
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    const applicant = applicants.find(app => app._id === applicationId);
    if (!applicant) return;

    if (applicant.status === 'accepted') {
      toast.info("Application is already accepted and cannot be changed.");
      return;
    }

    if (newStatus === 'accepted') {
      // Instead of minting directly, open the modal for HR to enter the URI
      setPendingApplicationForWallet(applicant);
      setIsWalletModalOpen(true);
      return;
    }

    setProcessingId(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status: ${response.statusText}`);
      }

      setApplicants(prevApplicants =>
        prevApplicants.map(app =>
          app._id === applicationId ? { ...app, status: newStatus, updatedAt: new Date().toISOString() } : app
        )
      );
      toast.success('Applicant status updated successfully!');

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (applicantId: string) => {
    setExpandedApplicantId(prevId => (prevId === applicantId ? null : applicantId));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-red-500">{error}</p>
        <Link href="/hr/jobs" className="text-indigo-400 hover:underline mt-4 inline-block flex items-center gap-1">
          <FiArrowLeft /> Back to My Job Postings
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-900 bg-opacity-50';
      case 'reviewed': return 'text-blue-400 bg-blue-900 bg-opacity-50';
      case 'accepted': return 'text-green-400 bg-green-900 bg-opacity-50';
      case 'rejected': return 'text-red-400 bg-red-900 bg-opacity-50';
      default: return 'text-gray-400 bg-gray-700';
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Link href="/hr/jobs" className="text-indigo-400 hover:underline mb-4 inline-block flex items-center gap-1">
        <FiArrowLeft /> Back to My Job Postings
      </Link>
      <h1 className="text-3xl font-bold text-indigo-300 mb-2">Applicants for: {jobTitle || 'Loading...'}</h1>
      <p className="text-gray-400 mb-8">Manage applications submitted for this job posting.</p>

      {/* HR input fields for company, job title, job id (like post-job NFT mint) */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="text-md font-semibold text-indigo-300 mb-2">HR NFT Minting Details</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            className="w-full md:w-1/3 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-gray-100"
            placeholder="Company Name (override)"
            value={hrCompanyName}
            onChange={e => setHrCompanyName(e.target.value)}
          />
          <input
            type="text"
            className="w-full md:w-1/3 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-gray-100"
            placeholder="Job Title (override)"
            value={hrJobTitle}
            onChange={e => setHrJobTitle(e.target.value)}
          />
          <input
            type="text"
            className="w-full md:w-1/3 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-gray-100"
            placeholder="Job ID (override)"
            value={hrJobId}
            onChange={e => setHrJobId(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          You may override the company, job title, or job id for the NFT minting call. Leave blank to use the job's default values.
        </p>
      </div>

      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        isOpen={isWalletModalOpen} 
        onClose={() => {
          setIsWalletModalOpen(false);
          setPendingApplicationForWallet(null);
          // Do NOT clear modalApplicantAddress here, so it persists during minting
          console.debug('[JobApplicantsPage] Modal closed');
        }}
        // Always use the persistent modalApplicantAddress for the modal
        applicantAddress={modalApplicantAddress}
        hrWalletAddress={hrWalletAddress}
        hrWalletIsValid={hrWalletIsValid}
        onMint={async (uri: string) => {
          console.debug('[JobApplicantsPage] onMint called', { uri, pendingApplicationForWallet, modalApplicantAddress });
          if (pendingApplicationForWallet) {
            // Pass the persistent modalApplicantAddress to handleMintHireNFT
            await handleMintHireNFT(
              { ...pendingApplicationForWallet, profile: { ...(pendingApplicationForWallet.profile || {}), starknetAddress: modalApplicantAddress } },
              uri,
              hrCompanyName,
              hrJobTitle,
              hrJobId
            );
          }
        }}
        mintingState={hireMintingState}
        mintError={hireMintError}
      />

      {applicants.length === 0 ? (
        <div className="bg-gray-800 p-8 text-center rounded-lg border border-gray-700">
          <p className="text-gray-400">No applicants yet for this position.</p>
        </div>
      ) : (
        <div className="space-y-6">
          

          {applicants.map(applicant => (
            <div key={applicant._id} className="bg-gray-800 rounded-lg shadow-md p-5 border border-gray-700 transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div className="flex items-center gap-4 flex-grow">
                  <img
                    src={(applicant as any).profile.photo || '/profile.png'}
                    alt={`${applicant.user.name}'s profile picture`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-indigo-300 flex items-center gap-2">
                      {applicant.user.name}
                      <Link href={`/profile?email=${encodeURIComponent(applicant.user.email)}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm" title="View Developer Profile">
                        <FiExternalLink />
                      </Link>
                    </h2>
                    <p className="text-sm text-gray-400 flex items-center gap-1"><FiMail /> {applicant.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FiCalendar /> Applied: {new Date(applicant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0 mt-4 md:mt-0">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(applicant.status)}`}>
                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                  </span>
                  <div className="relative mt-2">
                    <select
                      value={applicant.status}
                      onChange={(e) => handleStatusChange(applicant._id, e.target.value as ApplicationStatus)}
                      disabled={processingId === applicant._id || applicant.status === 'accepted' || processingHireMintId === applicant._id}
                      className="appearance-none w-full bg-gray-700 border border-gray-600 text-white text-sm py-1 pl-3 pr-8 rounded leading-tight focus:outline-none focus:bg-gray-600 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {APPLICATION_STATUS.map(statusOption => (
                        <option key={statusOption} value={statusOption} disabled={applicant.status === 'accepted' && statusOption !== 'accepted'}>
                          {statusOption === 'accepted' ? 'Accept & Mint Hire NFT' : `Set to: ${statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}`}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                    {processingId === applicant._id && (
                      <FiLoader className="animate-spin text-indigo-400 absolute -left-6 top-1/2 transform -translate-y-1/2" title="Updating status..." />
                    )}
                  </div>

                  {applicant.status !== 'accepted' && processingHireMintId === applicant._id && (
                    <div className="mt-2 text-sm w-full text-right">
                      {hireMintingState === 'prompt' && <p className="text-indigo-300 animate-pulse">Approve in wallet...</p>}
                      {hireMintingState === 'pending' && <p className="text-indigo-300 flex items-center justify-end gap-2"><FiLoader className="animate-spin" /> Sending Tx...</p>}
                      {hireMintingState === 'error' && hireMintError && (
                        <div className="mt-1 p-1.5 bg-red-900/40 border border-red-700 rounded text-left">
                          <p className="text-red-400 text-xs font-medium">Hire NFT Mint Failed</p>
                          <p className="text-red-300 text-xs mt-1">{hireMintError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {applicant.status === 'accepted' && applicant.hireNftTxHash && getExplorerUrl(applicant.hireNftTxHash) && (
                    <div className="mt-2 text-xs text-gray-400">
                      <span>Hire NFT Minted: </span>
                      <a
                        className="text-indigo-400 hover:underline"
                        title="View Hire NFT Transaction on Explorer"
                      >
                        {applicant.hireNftTxHash.substring(0, 6)}...{applicant.hireNftTxHash.substring(applicant.hireNftTxHash.length - 4)} <FiExternalLink className="inline-block ml-1" />
                      </a>
                    </div>
                  )}
                  {applicant.status === 'accepted' && !applicant.hireNftTxHash && (
                    <p className="mt-2 text-xs text-yellow-500 italic">Accepted (NFT not minted/found)</p>
                  )}

                  <button
                    onClick={() => toggleExpand(applicant._id)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 flex items-center gap-1"
                  >
                    {expandedApplicantId === applicant._id ? <FiChevronUp /> : <FiChevronDown />}
                    {expandedApplicantId === applicant._id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>

              {expandedApplicantId === applicant._id && (
                <div className="mt-6 pt-4 border-t border-gray-700 animate-fadeIn">
                  {applicant.profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-3">Key Profile Scores</h4>
                        {applicant.profile.scores && Object.keys(applicant.profile.scores).length > 0 ? (
                          <DomainScoresHeader scores={applicant.profile.scores} />
                        ) : (
                          <p className="text-sm text-gray-500 italic">No domain scores available.</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-3">Skills & Stats</h4>
                        {applicant.profile.skills && applicant.profile.skills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-400 mb-1 font-medium">Top Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {applicant.profile.skills.slice(0, 5).map(skill => (
                                <span key={skill} className="bg-indigo-900/70 text-indigo-200 text-xs px-2.5 py-1 rounded-full border border-indigo-700/50">
                                  {skill}
                                </span>
                              ))}
                              {applicant.profile.skills.length > 5 && <span className="text-xs text-gray-500 self-center">...</span>}
                            </div>
                          </div>
                        )}
                        {(applicant.profile.leetCodeStats || applicant.profile.gfgStats) && (
                          <div className="space-y-2 text-sm">
                            {applicant.profile.leetCodeStats && (
                              <div className="flex items-center gap-2 text-gray-300">
                                <FaTrophy className="text-yellow-400" />
                                <span>LeetCode: {applicant.profile.leetCodeStats.totalSolved ?? 'N/A'} Solved (Rank: {applicant.profile.leetCodeStats.ranking ?? 'N/A'})</span>
                              </div>
                            )}
                            {applicant.profile.gfgStats?.info && (
                              <div className="flex items-center gap-2 text-gray-300">
                                <FaStar className="text-green-400" />
                                <span>GFG: {applicant.profile.gfgStats.info.totalProblemsSolved ?? 'N/A'} Solved (Score: {applicant.profile.gfgStats.info.codingScore ?? 'N/A'})</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 mt-4 text-sm">
                          {applicant.profile.github && <a href={`https://github.com/${applicant.profile.github}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1"><FaCodeBranch /> GitHub</a>}
                          {applicant.profile.leetcode && <a href={`https://leetcode.com/${applicant.profile.leetcode}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1"><FaTrophy /> LeetCode</a>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic text-center">Detailed profile information not available for this user.</p>
                  )}

                  {/* Add a warning if the developer doesn't have a valid wallet address */}
                  { (
                    <div className="mt-3 p-2 bg-orange-900/30 border border-orange-700/50 rounded-lg">
                      <p className="text-orange-400 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>This developer hasn't connected a valid StarkNet wallet. They need to do this before you can mint a Hire NFT.</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-md font-semibold text-gray-300 mb-2 flex items-center gap-1"><FiFileText /> Cover Letter</h3>
                <p className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-750 p-3 rounded">
                  {applicant.coverLetter}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

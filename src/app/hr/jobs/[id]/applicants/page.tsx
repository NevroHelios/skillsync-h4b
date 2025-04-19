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
import { useAccount } from "@starknet-react/core";
import { Contract } from "starknet";
import { Buffer } from 'buffer'; // If using Buffer for encoding
import WalletConnectModal from '@/components/WalletConnectModal';

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
}

const hireNftMinimalAbi = [
  {
    "type": "function",
    "name": "hire_developer",
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
  const maxSize = 31; // Max characters for short string representation
  if (str.length > maxSize) {
    console.warn(`String "${str}" is too long for felt252 encoding. Truncating.`);
    str = str.substring(0, maxSize);
  }
  return '0x' + Buffer.from(str, 'utf8').toString('hex');
};

const getExplorerUrl = (txHash: string): string | null => {
  if (!txHash) return null;
  return `https://voyager.online/tx/${txHash}`;
};

// Helper function to check if a StarkNet address is valid (not all zeros or invalid)
const isValidStarknetAddress = (address: string | undefined): boolean => {
  if (!address) return false;
  // Check if address is all zeros (except 0x prefix)
  const strippedAddress = address.startsWith('0x') ? address.substring(2) : address;
  return strippedAddress.length === 64 && !/^0*$/.test(strippedAddress);
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

  const { account, address, isConnected, status: accountStatus } = useAccount();

  const jobId = params.id as string;

  // Check if HR wallet is connected and valid
  const hrWalletIsValid = isConnected && address && isValidStarknetAddress(address);

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
    // First check if wallet is connected at all
    if (!isConnected || !account) {
      // Save the pending applicant data
      setPendingApplicationForWallet(applicant);
      // Open wallet connection modal
      setIsWalletModalOpen(true);
      return false;
    }
    
    // Then check if the connected wallet address is valid
    if (!hrWalletIsValid) {
      toast.error("Your wallet address appears to be invalid. Please disconnect and connect again.");
      setPendingApplicationForWallet(applicant);
      setIsWalletModalOpen(true);
      return false;
    }
    
    return true;
  };

  const handleMintHireNFT = async (applicant: Applicant) => {
    if (!jobDetails) {
      toast.error("Job details not loaded. Cannot mint.");
      return;
    }

    const hireContractAddress = process.env.NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS_HIRE;
    if (!hireContractAddress) {
      setHireMintingState('error');
      const errorMsg = "Hire NFT contract address is not configured.";
      setHireMintError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Check if HR wallet is connected and valid
    if (!hrWalletIsValid) {
      if (!checkWalletConnection(applicant)) {
        return;
      }
    }

    // Get developer's wallet address
    const developerAddress = applicant.profile?.starknetAddress;
    
    // Validate developer's wallet address
    if (!developerAddress || !isValidStarknetAddress(developerAddress)) {
      setHireMintingState('error');
      const errorMsg = `Cannot mint: ${applicant.user.name}'s wallet address is missing or invalid. They must connect their wallet in their profile.`;
      setHireMintError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Clear pending application as we're now processing it
    setPendingApplicationForWallet(null);
    setProcessingHireMintId(applicant._id);
    setHireMintingState('prompt');
    setHireMintError(null);
    setHireMintTxHash(null);

    try {
      const jobIdFelt = safeEncodeFelt252(jobId);
      const companyNameFelt = safeEncodeFelt252(jobDetails.company);
      const jobTitleFelt = safeEncodeFelt252(jobDetails.title);
      const metadataUri = `ipfs://hire_${applicant._id}_${jobId}`;
      const uriFelt = safeEncodeFelt252(metadataUri);

      const contract = new Contract(hireNftMinimalAbi, hireContractAddress, account);

      setHireMintingState('pending');
      toast.info("Sending Hire NFT transaction... Please approve in your wallet.");

      const txResponse = await contract.invoke("hire_developer", [
        developerAddress,
        jobIdFelt,
        companyNameFelt,
        jobTitleFelt,
        uriFelt
      ]);

      console.log("StarkNet Hire NFT Tx Response:", txResponse);
      setHireMintTxHash(txResponse.transaction_hash);

      setHireMintingState('success');
      toast.success("Hire NFT transaction sent! Saving details...");

      try {
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

        const updatedApplicationData = await updateResponse.json();

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
        setHireMintError(`Transaction sent (${txResponse.transaction_hash.substring(0, 8)}...), but failed to save details to database: ${dbError.message}`);
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
      const hireContractAddress = process.env.NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS_HIRE;
      if (!hireContractAddress) {
        toast.error("Hire NFT contract address is not configured. Cannot accept via minting.");
        return;
      }
      
      // Check if wallet is connected before proceeding to mint
      if (!hrWalletIsValid) {
        if (!checkWalletConnection(applicant)) {
          return;
        }
      }
      
      if (!applicant.starknetAddress || applicant.starknetAddress === "0x0000000000000000000000000000000000000000000000000000000000000001") {
        toast.error(`Cannot mint: StarkNet address for applicant ${applicant.user.name} is missing or invalid.`);
        return;
      }

      handleMintHireNFT(applicant);

    } else {
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

      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        isOpen={isWalletModalOpen} 
        onClose={() => {
          setIsWalletModalOpen(false);
          setPendingApplicationForWallet(null);
        }}
        applicantAddress={pendingApplicationForWallet?.profile?.starknetAddress ?? ''}
        onMint={() => {
          if (pendingApplicationForWallet) {
            setIsWalletModalOpen(false);
            // Only proceed if wallet is now valid
            if (hrWalletIsValid) {
              handleMintHireNFT(pendingApplicationForWallet);
            } else {
              toast.error("Your wallet connection is invalid. Please disconnect and try again.");
            }
          }
        }}
      />

      {applicants.length === 0 ? (
        <div className="bg-gray-800 p-8 text-center rounded-lg border border-gray-700">
          <p className="text-gray-400">No applicants yet for this position.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {!hrWalletIsValid && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  Connect a valid StarkNet wallet to mint Hire NFTs. {isConnected ? "Your current wallet address appears invalid." : ""}
                </span>
              </p>
              <button 
                onClick={() => setIsWalletModalOpen(true)}
                className="mt-2 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md text-sm"
              >
                {isConnected ? "Reconnect Wallet" : "Connect Wallet"}
              </button>
            </div>
          )}

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
                        href={getExplorerUrl(applicant.hireNftTxHash)!}
                        target="_blank"
                        rel="noopener noreferrer"
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
                  {!isValidStarknetAddress(applicant.profile?.starknetAddress) && (
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

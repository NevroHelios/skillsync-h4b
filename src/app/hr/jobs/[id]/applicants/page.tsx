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
  } | null;
}

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null); // Track which application is being updated
  const [jobTitle, setJobTitle] = useState<string>(''); // State for job title
  const [error, setError] = useState<string | null>(null); // State for error messages
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(null); // State to track expanded applicant

  const jobId = params.id as string;

  // Fetch job and applicants data
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
        setError(null); // Reset error state
        try {
          // 1. Fetch applicants directly - this endpoint includes ownership check
          const applicantsResponse = await fetch(`/api/applications/job/${jobId}`);
          if (!applicantsResponse.ok) {
            if (applicantsResponse.status === 404) {
              setError('Job not found or you do not have permission to view its applicants.');
              toast.error('Job not found or permission denied.');
              setApplicants([]); // Ensure applicants are empty on error
            } else {
              const errorData = await applicantsResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to fetch applicants: ${applicantsResponse.statusText}`);
            }
          } else {
            const applicantsData: Applicant[] = await applicantsResponse.json();
            setApplicants(applicantsData);

            // 2. If applicants fetched successfully, fetch job title for display
            try {
              const jobTitleResponse = await fetch(`/api/jobs/public/${jobId}`);
              if (jobTitleResponse.ok) {
                const jobData: { title: string } = await jobTitleResponse.json();
                setJobTitle(jobData.title);
              } else {
                console.warn("Could not fetch job title after fetching applicants.");
                setJobTitle('Job Details'); // Fallback title
              }
            } catch (titleError) {
              console.error("Error fetching job title:", titleError);
              setJobTitle('Job Details'); // Fallback title on error
            }
          }

        } catch (error: any) {
          console.error('Error fetching applicants:', error);
          setError(`Failed to load applicant data: ${error.message}`);
          toast.error(`Failed to load applicant data: ${error.message}`);
          setApplicants([]); // Ensure applicants are empty on error
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuthAndFetch();
  }, [jobId, authStatus, session, router]);

  // Function to handle status update
  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    setProcessingId(applicationId); // Show loading indicator for this specific applicant
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

      // Update the local state to reflect the change
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
      setProcessingId(null); // Hide loading indicator
    }
  };

  // Toggle expanded view
  const toggleExpand = (applicantId: string) => {
    setExpandedApplicantId(prevId => (prevId === applicantId ? null : applicantId));
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-indigo-400" />
      </div>
    );
  }

  // Error state display
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

  // Get status color helper
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

      {applicants.length === 0 ? (
        <div className="bg-gray-800 p-8 text-center rounded-lg border border-gray-700">
          <p className="text-gray-400">No applicants yet for this position.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applicants.map(applicant => (
            <div key={applicant._id} className="bg-gray-800 rounded-lg shadow-md p-5 border border-gray-700 transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                {/* Applicant Info */}
                <div className="flex items-center gap-4 flex-grow">
                  <img
                    src={(applicant as any).profile.photo || '/profile.png'} // Use default avatar
                    alt={`${applicant.user.name}'s profile picture`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }} // Fallback
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

                {/* Status & Actions */}
                <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0 mt-4 md:mt-0">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(applicant.status)}`}>
                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                  </span>
                  <div className="relative mt-2">
                    <select
                      value={applicant.status}
                      onChange={(e) => handleStatusChange(applicant._id, e.target.value as ApplicationStatus)}
                      disabled={processingId === applicant._id} // Disable while processing this specific applicant
                      className="appearance-none w-full bg-gray-700 border border-gray-600 text-white text-sm py-1 pl-3 pr-8 rounded leading-tight focus:outline-none focus:bg-gray-600 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {APPLICATION_STATUS.map(statusOption => (
                        <option key={statusOption} value={statusOption}>
                          Set to: {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                    {processingId === applicant._id && (
                      <FiLoader className="animate-spin text-indigo-400 absolute -left-6 top-1/2 transform -translate-y-1/2" />
                    )}
                  </div>
                  <button
                    onClick={() => toggleExpand(applicant._id)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 flex items-center gap-1"
                  >
                    {expandedApplicantId === applicant._id ? <FiChevronUp /> : <FiChevronDown />}
                    {expandedApplicantId === applicant._id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>

              {/* Expanded Details Section */}
              {expandedApplicantId === applicant._id && (
                <div className="mt-6 pt-4 border-t border-gray-700 animate-fadeIn">
                  {applicant.profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Domain Scores */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-3">Key Profile Scores</h4>
                        {applicant.profile.scores && Object.keys(applicant.profile.scores).length > 0 ? (
                          <DomainScoresHeader scores={applicant.profile.scores} />
                        ) : (
                          <p className="text-sm text-gray-500 italic">No domain scores available.</p>
                        )}
                      </div>

                      {/* Skills & Stats */}
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
                        {/* Links */}
                        <div className="flex flex-wrap gap-4 mt-4 text-sm">
                          {applicant.profile.github && <a href={`https://github.com/${applicant.profile.github}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1"><FaCodeBranch /> GitHub</a>}
                          {applicant.profile.leetcode && <a href={`https://leetcode.com/${applicant.profile.leetcode}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1"><FaTrophy /> LeetCode</a>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic text-center">Detailed profile information not available for this user.</p>
                  )}
                </div>
              )}

              {/* Cover Letter (always visible) */}
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

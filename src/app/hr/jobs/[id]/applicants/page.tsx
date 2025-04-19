"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  company: string;
  status: string;
}

interface Applicant {
  _id: string;
  userId: string;
  coverLetter: string;
  resume?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  user: {
    name?: string;
    email: string;
    photo?: string;
  };
}

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const jobId = params.id as string;
  
  // Check authentication and fetch data
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // Redirect if not authenticated or not HR
      if (authStatus === 'unauthenticated' || (authStatus === 'authenticated' && (session?.user as any)?.role !== 'hr')) {
        toast.error('Access denied. HR role required.');
        router.push('/');
        return;
      }
      
      if (authStatus === 'authenticated') {
        try {
          // Fetch job details
          const jobResponse = await fetch(`/api/jobs/${jobId}`);
          if (!jobResponse.ok) {
            if (jobResponse.status === 404) {
              toast.error('Job not found');
              router.push('/hr/jobs');
              return;
            }
            throw new Error(`Failed to fetch job: ${jobResponse.status}`);
          }
          
          const jobData = await jobResponse.json();
          setJob(jobData);
          
          // Verify the HR user owns this job
          if (jobData.postedBy !== (session?.user as any).id) {
            toast.error('You can only view applicants for your own job postings');
            router.push('/hr/jobs');
            return;
          }
          
          // Fetch applicants
          const applicantsResponse = await fetch(`/api/applications/job/${jobId}`);
          if (!applicantsResponse.ok) {
            throw new Error(`Failed to fetch applicants: ${applicantsResponse.status}`);
          }
          
          const applicantsData = await applicantsResponse.json();
          setApplicants(applicantsData);
        } catch (error) {
          console.error('Error:', error);
          toast.error('Failed to load data');
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (authStatus !== 'loading') {
      checkAuthAndFetch();
    }
  }, [jobId, authStatus, session, router]);
  
  // Update application status
  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    setProcessingId(applicationId);
    
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      // Update local state
      setApplicants(prev => 
        prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: newStatus as 'pending' | 'reviewed' | 'accepted' | 'rejected' }
            : app
        )
      );
      
      toast.success(`Application marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application status');
    } finally {
      setProcessingId(null);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-64 mx-auto mb-6"></div>
          <div className="h-4 bg-gray-700 rounded w-48 mx-auto mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded max-w-3xl mx-auto"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/hr/jobs" className="text-indigo-400 hover:underline flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Jobs
        </Link>
      </div>
      
      {job && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h1 className="text-xl font-bold text-indigo-300 mb-1">
            Applicants for: {job.title}
          </h1>
          <p className="text-gray-400">{job.company} • {job.status}</p>
        </div>
      )}
      
      {applicants.length > 0 ? (
        <div className="space-y-6">
          {applicants.map((applicant) => (
            <div key={applicant._id} className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              {/* Applicant Header */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden mr-3">
                  {applicant.user.photo ? (
                    <img 
                      src={applicant.user.photo} 
                      alt={applicant.user.name || 'Applicant'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {(applicant.user.name || applicant.user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-gray-200 font-medium">
                    {applicant.user.name || 'Anonymous User'}
                  </h3>
                  <p className="text-gray-400 text-sm">{applicant.user.email}</p>
                </div>
                <div className="ml-auto">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    applicant.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                    applicant.status === 'reviewed' ? 'bg-blue-900 text-blue-300' :
                    applicant.status === 'accepted' ? 'bg-green-900 text-green-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {/* Application Details */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Cover Letter</h4>
                <div className="bg-gray-700 p-3 rounded text-gray-200 max-h-48 overflow-y-auto">
                  {applicant.coverLetter}
                </div>
              </div>
              
              {applicant.resume && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Resume</h4>
                  <a 
                    href={applicant.resume} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Resume
                  </a>
                </div>
              )}
              
              {/* Application Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
                {applicant.status === 'pending' && (
                  <button
                    onClick={() => updateApplicationStatus(applicant._id, 'reviewed')}
                    disabled={processingId === applicant._id}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                  >
                    {processingId === applicant._id ? 'Processing...' : 'Mark as Reviewed'}
                  </button>
                )}
                
                {(applicant.status === 'pending' || applicant.status === 'reviewed') && (
                  <>
                    <button
                      onClick={() => updateApplicationStatus(applicant._id, 'accepted')}
                      disabled={processingId === applicant._id}
                      className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-sm disabled:opacity-50"
                    >
                      {processingId === applicant._id ? 'Processing...' : 'Accept'}
                    </button>
                    
                    <button
                      onClick={() => updateApplicationStatus(applicant._id, 'rejected')}
                      disabled={processingId === applicant._id}
                      className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-sm disabled:opacity-50"
                    >
                      {processingId === applicant._id ? 'Processing...' : 'Reject'}
                    </button>
                  </>
                )}
                
                <Link 
                  href={`/profiles/${applicant.userId}`}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm ml-auto"
                >
                  View Profile
                </Link>
              </div>
              
              <div className="text-xs text-gray-500 mt-3">
                Applied on: {new Date(applicant.createdAt).toLocaleDateString()} at {new Date(applicant.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 p-8 text-center rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Applicants Yet</h3>
          <p className="text-gray-400">
            There are no applicants for this job posting yet.
          </p>
        </div>
      )}
    </div>
  );
}

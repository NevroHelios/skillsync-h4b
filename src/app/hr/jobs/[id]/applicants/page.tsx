'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { FiUser, FiMail, FiFileText, FiCalendar, FiEdit, FiCheck, FiX, FiClock, FiLoader, FiArrowLeft } from 'react-icons/fi';
import { APPLICATION_STATUS, ApplicationStatus } from '@/models/JobApplication'; // Import status constants

// Interfaces matching the data structure from the API
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
}

interface Job {
  _id: string;
  title: string;
  postedBy: string;
  // Add other job fields if needed
}

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null); // Track which application is being updated

  const jobId = params.id as string;

  // Fetch job and applicants data
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (authStatus === 'loading') return; // Wait until auth status is determined

      // Redirect if not authenticated or not HR
      if (authStatus === 'unauthenticated' || (authStatus === 'authenticated' && (session?.user as any)?.role !== 'hr')) {
        toast.error('Access denied. HR role required.');
        router.push('/');
        return;
      }

      if (authStatus === 'authenticated' && jobId) {
        setLoading(true);
        try {
          // Fetch job details first to verify ownership
          const jobResponse = await fetch(`/api/jobs/${jobId}`); // Use the HR-specific job endpoint if different
          if (!jobResponse.ok) {
            if (jobResponse.status === 404) {
              toast.error('Job not found');
              router.push('/hr/jobs'); // Redirect to HR job list
              return;
            }
            throw new Error(`Failed to fetch job: ${jobResponse.statusText}`);
          }
          const jobData: Job = await jobResponse.json();
          setJob(jobData);

          // Verify the HR user owns this job (assuming jobData.postedBy holds the user ID)
          if (jobData.postedBy !== (session?.user as any)?.id) {
            toast.error('You can only view applicants for your own job postings');
            router.push('/hr/jobs');
            return;
          }

          // Fetch applicants for this job
          const applicantsResponse = await fetch(`/api/applications/job/${jobId}`);
          if (!applicantsResponse.ok) {
            throw new Error(`Failed to fetch applicants: ${applicantsResponse.statusText}`);
          }
          const applicantsData: Applicant[] = await applicantsResponse.json();
          setApplicants(applicantsData);

        } catch (error: any) {
          console.error('Error fetching job/applicants:', error);
          toast.error(`Failed to load data: ${error.message}`);
          // Consider redirecting or showing an error message
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

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-indigo-400" />
      </div>
    );
  }

  // No job found or error state (though redirects handle most cases)
  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-red-500">Could not load job information.</p>
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
      <h1 className="text-3xl font-bold text-indigo-300 mb-2">Applicants for: {job.title}</h1>
      <p className="text-gray-400 mb-8">Manage applications submitted for this job posting.</p>

      {applicants.length === 0 ? (
        <div className="bg-gray-800 p-8 text-center rounded-lg border border-gray-700">
          <p className="text-gray-400">No applicants yet for this position.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applicants.map(applicant => (
            <div key={applicant._id} className="bg-gray-800 rounded-lg shadow-md p-5 border border-gray-700">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                {/* Applicant Info */}
                <div className="flex items-center gap-4 flex-grow">
                  <img
                    src={applicant.user.photo || '/profile.png'} // Default placeholder image
                    alt={`${applicant.user.name}'s profile picture`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-indigo-300">{applicant.user.name}</h2>
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
                </div>
              </div>

              {/* Cover Letter */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-md font-semibold text-gray-300 mb-2 flex items-center gap-1"><FiFileText /> Cover Letter</h3>
                <p className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-750 p-3 rounded">
                  {applicant.coverLetter}
                </p>
              </div>

              {/* Add Resume link/download later if implemented */}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

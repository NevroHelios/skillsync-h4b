'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { FiBriefcase, FiMapPin, FiClock, FiTag, FiDollarSign, FiFileText, FiCheckCircle, FiXCircle, FiLoader, FiSend } from 'react-icons/fi';
import Link from 'next/link';

// Interfaces (ensure these match your data structures)
interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  techStack: string[];
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  experienceLevel?: string;
  status: 'Open' | 'Closed' | 'Draft';
  createdAt: string;
  // Add other fields as needed
}

interface ApplicationData {
  jobId: string;
  coverLetter: string;
  // resume?: string; // Add later if needed
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState<boolean | null>(null); // null = checking, true/false = result
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  const jobId = params.id as string;

  // Fetch job details
  useEffect(() => {
    if (!jobId) return;
    const fetchJobDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/jobs/public/${jobId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Job not found.');
            router.push('/jobs/dashboard'); // Redirect to dashboard
          } else {
            throw new Error(`Failed to fetch job details: ${response.status}`);
          }
          return;
        }
        const data: Job = await response.json();
        // Ensure only 'Open' jobs are displayed on this public page
        if (data.status !== 'Open') {
            toast.error('This job is no longer available.');
            router.push('/jobs/dashboard');
            return;
        }
        setJob(data);
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast.error('Failed to load job details.');
        router.push('/jobs/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId, router]);

  // Check if user has already applied
  useEffect(() => {
    if (authStatus === 'authenticated' && jobId && (session?.user as any)?.role !== 'hr') {
      const checkApplicationStatus = async () => {
        try {
          const response = await fetch(`/api/applications/check?jobId=${jobId}`);
          if (!response.ok) {
            // Don't throw error, just assume not applied if check fails
            console.error('Failed to check application status:', response.statusText);
            setHasApplied(false);
            return;
          }
          const data = await response.json();
          setHasApplied(data.hasApplied);
        } catch (error) {
          console.error('Error checking application status:', error);
          setHasApplied(false); // Assume not applied on error
        }
      };
      checkApplicationStatus();
    }
     else if (authStatus === 'unauthenticated' || (session?.user as any)?.role === 'hr') {
        setHasApplied(false); // Cannot apply if not logged in as dev or if HR
    }
  }, [authStatus, jobId, session]);

  const handleApplyClick = () => {
    if (authStatus !== 'authenticated') {
      toast.info('Please sign in to apply for jobs.');
      router.push('/auth/signin');
      return;
    }
    if ((session?.user as any)?.role === 'hr') {
        toast.warn('HR accounts cannot apply for jobs.');
        return;
    }
    if (hasApplied === true) {
        toast.info('You have already applied for this job.');
        return;
    }
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!coverLetter.trim()) {
      toast.warn('Please write a cover letter.');
      return;
    }
    if (!jobId || !session?.user)
        return;

    setApplying(true);
    try {
      const applicationData: ApplicationData = {
        jobId,
        coverLetter,
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Application failed: ${response.statusText}`);
      }

      toast.success('Application submitted successfully!');
      setHasApplied(true); // Update status immediately
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(`Application failed: ${error.message}`);
    } finally {
      setApplying(false);
    }
  };

  if (loading || hasApplied === null) {
    return (
      <div className="container mx-auto p-6 text-center min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-indigo-400" />
      </div>
    );
  }

  if (!job) {
    // Error/not found handled by redirect in useEffect, but keep a fallback
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-xl text-red-500">Job not found or unavailable.</p>
        <Link href="/jobs/dashboard" className="text-indigo-400 hover:underline mt-4 inline-block">
          Back to Job Dashboard
        </Link>
      </div>
    );
  }

  const canApply = authStatus === 'authenticated' && (session?.user as any)?.role !== 'hr';

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-indigo-300 mb-2">{job.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-gray-400 text-sm">
            <span className="flex items-center gap-1"><FiBriefcase /> {job.company}</span>
            <span className="flex items-center gap-1"><FiMapPin /> {job.location}</span>
            <span className="flex items-center gap-1"><FiClock /> Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Job Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-indigo-400 mb-3">Job Description</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{job.description}</p>
          </div>
          <div className="md:col-span-1 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-1">Employment Type</h3>
              <p className="text-indigo-300">{job.employmentType || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-1">Experience Level</h3>
              <p className="text-indigo-300">{job.experienceLevel || 'Not specified'}</p>
            </div>
            {(job.salaryMin || job.salaryMax) && (
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-1 flex items-center gap-1"><FiDollarSign /> Salary Range</h3>
                <p className="text-indigo-300">
                  {job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : ''}
                  {job.salaryMin && job.salaryMax ? ' - ' : ''}
                  {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : ''}
                  {!job.salaryMin && !job.salaryMax ? 'Not specified' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-indigo-400 mb-3 flex items-center gap-1"><FiTag /> Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.techStack.map(tech => (
              <span key={tech} className="bg-gray-700 text-indigo-300 text-sm px-3 py-1 rounded-full">
                {tech}
              </span>
            ))}
            {job.techStack.length === 0 && <p className="text-gray-400 text-sm">No specific skills listed.</p>}
          </div>
        </div>

        {/* Apply Button Area */}
        <div className="text-center mt-8 pt-6 border-t border-gray-700">
          {hasApplied === true ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <FiCheckCircle /> Applied Successfully!
            </div>
          ) : (
            <button
              onClick={handleApplyClick}
              disabled={!canApply || applying || hasApplied === true}
              className={`px-6 py-3 rounded-md font-semibold transition duration-200 flex items-center justify-center gap-2 mx-auto ${ 
                !canApply
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : hasApplied === true 
                  ? 'bg-green-700 text-green-200 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500'
              }`}
            >
              {applying ? <FiLoader className="animate-spin" /> : <FiSend />}
              {applying ? 'Submitting...' : hasApplied === true ? 'Applied' : 'Apply Now'}
            </button>
          )}
          {!canApply && authStatus !== 'authenticated' && (
            <p className="text-sm text-gray-400 mt-2">Please <Link href="/auth/signin" className="text-indigo-400 hover:underline">sign in</Link> as a developer to apply.</p>
          )}
           {!canApply && authStatus === 'authenticated' && (session?.user as any)?.role === 'hr' && (
            <p className="text-sm text-gray-400 mt-2">HR accounts cannot apply for jobs.</p>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              disabled={applying}
            >
              <FiXCircle size={24} />
            </button>
            <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Apply for: {job.title}</h2>
            <form onSubmit={(e) => { e.preventDefault(); submitApplication(); }}>
              <div className="mb-4">
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-300 mb-1">Cover Letter</label>
                <textarea
                  id="coverLetter"
                  rows={8}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the employer why you are a good fit for this role..."
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-white resize-none"
                  required
                  disabled={applying}
                />
              </div>
              {/* Add Resume Upload later if needed */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  disabled={applying}
                  className="px-4 py-2 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500 transition duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying || !coverLetter.trim()}
                  className="px-4 py-2 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? <FiLoader className="animate-spin" /> : <FiSend />}
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

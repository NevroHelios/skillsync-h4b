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
  location: string;
  description: string;
  techStack: string[];
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  experienceLevel?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resume: '',
  });
  
  const jobId = params.id as string;
  
  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`/api/jobs/public/${jobId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Job not found');
            router.push('/jobs');
            return;
          }
          throw new Error(`Failed to fetch job details: ${response.status}`);
        }
        
        const data = await response.json();
        setJob(data);
        
        // Check if user has already applied
        if (session?.user) {
          const applicationCheck = await fetch(`/api/applications/check?jobId=${jobId}`);
          if (applicationCheck.ok) {
            const { hasApplied } = await applicationCheck.json();
            setHasApplied(hasApplied);
          }
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, router, session?.user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast.error('Please sign in to apply for jobs');
      router.push(`/auth/signin?callbackUrl=/jobs/${jobId}`);
      return;
    }
    
    if (!job) return;
    
    setApplying(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          ...applicationData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }
      
      toast.success('Application submitted successfully!');
      setHasApplied(true);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-400">Job not found</p>
        <Link href="/jobs" className="text-indigo-400 hover:underline mt-4 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        {/* Job Header */}
        <div className="mb-6 pb-6 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-300 mb-2">
              {job.title}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm ${
              job.status === 'Open' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
            }`}>
              {job.status}
            </span>
          </div>
          <p className="text-lg text-gray-300">{job.company}</p>
          <p className="text-gray-400">{job.location}</p>
        </div>
        
        {/* Job Details */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(job.salaryMin || job.salaryMax) && (
            <div>
              <h3 className="text-sm font-medium text-gray-400">Salary Range</h3>
              <p className="text-gray-200">
                {job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : 'Negotiable'}
                {job.salaryMin && job.salaryMax ? ' - ' : ''}
                {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : ''}
              </p>
            </div>
          )}
          
          {job.employmentType && (
            <div>
              <h3 className="text-sm font-medium text-gray-400">Employment Type</h3>
              <p className="text-gray-200">{job.employmentType}</p>
            </div>
          )}
          
          {job.experienceLevel && (
            <div>
              <h3 className="text-sm font-medium text-gray-400">Experience Level</h3>
              <p className="text-gray-200">{job.experienceLevel}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-gray-400">Posted On</h3>
            <p className="text-gray-200">{new Date(job.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        {/* Tech Stack */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {job.techStack.map(tech => (
              <span key={tech} className="bg-gray-700 px-3 py-1 rounded-full text-indigo-300 text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
        
        {/* Job Description */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Description</h3>
          <div className="text-gray-300 space-y-4 whitespace-pre-wrap">
            {job.description}
          </div>
        </div>
        
        {/* Application Section */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-semibold text-indigo-300 mb-4">Apply for this Position</h3>
          
          {!session?.user ? (
            <div className="text-center py-6 bg-gray-700/30 rounded-lg">
              <p className="text-gray-300 mb-4">Please sign in to apply for this job</p>
              <Link 
                href={`/auth/signin?callbackUrl=/jobs/${jobId}`}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Sign In to Apply
              </Link>
            </div>
          ) : hasApplied ? (
            <div className="bg-indigo-900/30 border border-indigo-800 rounded-lg p-6 text-center">
              <h4 className="text-lg font-medium text-indigo-300 mb-2">Application Submitted</h4>
              <p className="text-gray-300">You have already applied for this position.</p>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-300 mb-1">
                  Cover Letter
                </label>
                <textarea
                  id="coverLetter"
                  name="coverLetter"
                  rows={6}
                  value={applicationData.coverLetter}
                  onChange={handleInputChange}
                  placeholder="Write a brief cover letter explaining why you're a good fit for this position..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  disabled={applying}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-300 mb-1">
                  Resume Link (Optional)
                </label>
                <input
                  type="url"
                  id="resume"
                  name="resume"
                  value={applicationData.resume}
                  onChange={handleInputChange}
                  placeholder="https://example.com/your-resume.pdf"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  disabled={applying}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Link to your resume on Google Drive, Dropbox, etc.
                </p>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={applying}
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

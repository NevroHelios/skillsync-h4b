"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

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

export default function JobsPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    techStack: [] as string[],
    experienceLevel: '',
    employmentType: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch all available jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs/public');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status}`);
        }
        
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, []);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter jobs based on search term and filters
  const filteredJobs = jobs.filter(job => {
    // Only show Open jobs
    if (job.status !== 'Open') return false;
    
    // Apply search term filter
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !job.company.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply tech stack filter if any selected
    if (filters.techStack.length > 0 && 
        !job.techStack.some(tech => filters.techStack.includes(tech))) {
      return false;
    }
    
    // Apply experience level filter if selected
    if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) {
      return false;
    }
    
    // Apply employment type filter if selected
    if (filters.employmentType && job.employmentType !== filters.employmentType) {
      return false;
    }
    
    return true;
  });
  
  // Extract all unique tech stack tags across all jobs for filtering
  const allTechTags = Array.from(new Set(
    jobs.flatMap(job => job.techStack)
  )).sort();
  
  const toggleTechFilter = (tech: string) => {
    setFilters(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech) 
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech]
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-700 rounded mb-6"></div>
          <div className="h-4 w-96 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-80 bg-gray-700 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 p-5 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-center text-indigo-400 mb-8">
        Available Jobs
      </h1>
      
      {/* Search and Filters */}
      <div className="bg-gray-800 p-4 rounded-lg mb-8">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search jobs by title, company, or keywords"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        {/* Tech Stack Filter */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Filter by Skills:</h3>
          <div className="flex flex-wrap gap-2">
            {allTechTags.slice(0, 15).map(tech => (
              <button
                key={tech}
                onClick={() => toggleTechFilter(tech)}
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.techStack.includes(tech)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Job Listings */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <Link 
              href={`/jobs/${job._id}`}
              key={job._id} 
              className="bg-gray-800 rounded-lg p-5 hover:bg-gray-750 transition border border-gray-700 hover:border-indigo-500"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold text-indigo-300">{job.title}</h2>
                <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">
                  {job.status}
                </span>
              </div>
              
              <p className="text-gray-400 mb-3">{job.company} • {job.location}</p>
              
              <p className="text-sm text-gray-300 mb-4 line-clamp-3">{job.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {job.techStack.slice(0, 3).map(tech => (
                  <span key={tech} className="bg-gray-700 text-xs text-indigo-300 px-2 py-1 rounded-full">
                    {tech}
                  </span>
                ))}
                {job.techStack.length > 3 && (
                  <span className="bg-gray-700 text-xs text-gray-400 px-2 py-1 rounded-full">
                    +{job.techStack.length - 3}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">
                  {job.employmentType || 'Full-time'}
                </span>
                <span className="text-gray-400">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 p-8 text-center rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-2">No jobs matching your criteria found.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilters({ techStack: [], experienceLevel: '', employmentType: '' });
            }}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { FiSearch, FiMapPin, FiBriefcase, FiFilter, FiX } from 'react-icons/fi'; // Example icons

// Define the Job interface based on your Job model
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
}

// Define available filters (adjust based on your Job model enums)
const EXPERIENCE_LEVELS = ["Entry-level", "Mid-level", "Senior-level", "Lead", "Manager"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"];

export default function JobsDashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    techStack: [] as string[],
    experienceLevel: '',
    employmentType: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [allTechTags, setAllTechTags] = useState<string[]>([]);

  // Fetch all available jobs marked as 'Open'
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/jobs/public'); // Endpoint for public, open jobs
        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status}`);
        }
        const data: Job[] = await response.json();
        setJobs(data);
        // Extract unique tech tags for filtering
        const uniqueTags = Array.from(new Set(data.flatMap(job => job.techStack))).sort();
        setAllTechTags(uniqueTags);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const toggleTechFilter = (tech: string) => {
    setFilters(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech]
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ techStack: [], experienceLevel: '', employmentType: '' });
  };

  // Filter jobs based on search term and filters
  const filteredJobs = jobs.filter(job => {
    // Should already be 'Open', but double-check
    if (job.status !== 'Open') return false;

    // Apply search term filter (title, company, description)
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (searchTerm &&
        !job.title.toLowerCase().includes(lowerSearchTerm) &&
        !job.company.toLowerCase().includes(lowerSearchTerm) &&
        !job.description.toLowerCase().includes(lowerSearchTerm)) {
      return false;
    }

    // Apply tech stack filter
    if (filters.techStack.length > 0 &&
        !job.techStack.some(tech => filters.techStack.includes(tech))) {
      return false;
    }

    // Apply experience level filter
    if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) {
      return false;
    }

    // Apply employment type filter
    if (filters.employmentType && job.employmentType !== filters.employmentType) {
      return false;
    }

    return true;
  });

  // Loading State UI
  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-700 rounded mb-6"></div>
          {/* Placeholder for filters */}
          <div className="w-full max-w-4xl bg-gray-800 p-4 rounded-lg mb-8 flex flex-col md:flex-row gap-4">
            <div className="h-10 bg-gray-700 rounded flex-grow"></div>
            <div className="h-10 bg-gray-700 rounded w-32"></div>
            <div className="h-10 bg-gray-700 rounded w-32"></div>
          </div>
          {/* Placeholder for job cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 p-5 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard UI
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-center text-indigo-400 mb-8">
        Job Dashboard
      </h1>

      {/* Search and Filters Bar */}
      <div className="bg-gray-800 p-4 rounded-lg mb-8 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">Search Jobs</label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Title, company, keyword..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full p-2 pl-8 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-white"
              />
              <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Experience Level Filter */}
          <div>
            <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-300 mb-1">Experience</label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              value={filters.experienceLevel}
              onChange={handleFilterChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-white"
            >
              <option value="">All Levels</option>
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Employment Type Filter */}
          <div>
            <label htmlFor="employmentType" className="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <select
              id="employmentType"
              name="employmentType"
              value={filters.employmentType}
              onChange={handleFilterChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-white"
            >
              <option value="">All Types</option>
              {EMPLOYMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tech Stack Filters */}
        <div className="mt-4 pt-4 border-t border-gray-700">
           <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Tech Stack</label>
           <div className="flex flex-wrap gap-2">
             {allTechTags.map(tech => (
               <button
                 key={tech}
                 onClick={() => toggleTechFilter(tech)}
                 className={`px-3 py-1 rounded-full text-sm border ${
                   filters.techStack.includes(tech)
                     ? 'bg-indigo-600 text-white border-indigo-500'
                     : 'bg-gray-600 text-gray-200 border-gray-500 hover:bg-gray-500'
                 }`}
               >
                 {tech}
               </button>
             ))}
           </div>
        </div>

         {/* Clear Filters Button */}
         {(searchTerm || filters.techStack.length > 0 || filters.experienceLevel || filters.employmentType) && (
            <div className="mt-4 text-right">
                <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-auto"
                >
                    <FiX /> Clear All Filters
                </button>
            </div>
         )}
      </div>

      {/* Job Listings */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <Link
              href={`/jobs/${job._id}`} // Link to the specific job details page
              key={job._id}
              className="block bg-gray-800 rounded-lg p-5 hover:bg-gray-750 transition border border-gray-700 hover:border-indigo-500 shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold text-indigo-300 truncate" title={job.title}>{job.title}</h2>
                {/* Optional: Add a badge or indicator */}
              </div>

              <p className="text-gray-400 mb-1 flex items-center gap-1 text-sm"><FiBriefcase /> {job.company}</p>
              <p className="text-gray-400 mb-3 flex items-center gap-1 text-sm"><FiMapPin /> {job.location}</p>

              <p className="text-sm text-gray-300 mb-4 line-clamp-3">{job.description}</p>

              {/* Tech Stack Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {job.techStack.slice(0, 4).map(tech => ( // Show limited tags
                  <span key={tech} className="bg-gray-700 text-indigo-300 text-xs px-2 py-1 rounded">
                    {tech}
                  </span>
                ))}
                {job.techStack.length > 4 && (
                   <span className="text-gray-500 text-xs py-1">+{job.techStack.length - 4} more</span>
                )}
              </div>

              {/* Footer Info */}
              <div className="text-xs text-gray-500 border-t border-gray-700 pt-2 flex justify-between">
                <span>{job.employmentType} {job.experienceLevel ? `• ${job.experienceLevel}` : ''}</span>
                <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // No Jobs Found Message
        <div className="bg-gray-800 p-8 text-center rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-2">No jobs matching your criteria found.</p>
          <button
            onClick={clearFilters}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Clear filters and search again
          </button>
        </div>
      )}
    </div>
  );
}

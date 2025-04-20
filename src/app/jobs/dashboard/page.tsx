"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { Search, Briefcase, MapPin, Calendar, Filter, X, ChevronDown } from 'lucide-react';

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
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  
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

  // Experience levels
  const experienceLevels = ['Entry', 'Mid-Level', 'Senior', 'Lead'];
  
  // Employment types
  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  
  const toggleTechFilter = (tech: string) => {
    setFilters(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech) 
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech]
    }));
  };

  const setExperienceLevel = (level: string) => {
    setFilters(prev => ({
      ...prev,
      experienceLevel: prev.experienceLevel === level ? '' : level
    }));
  };

  const setEmploymentType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      employmentType: prev.employmentType === type ? '' : type
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({ techStack: [], experienceLevel: '', employmentType: '' });
  };

  const activeFiltersCount = 
    filters.techStack.length + 
    (filters.experienceLevel ? 1 : 0) + 
    (filters.employmentType ? 1 : 0) +
    (searchTerm ? 1 : 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content column - loading state */}
          <div className="w-full lg:w-3/4">
            <div className="animate-pulse">
              <div className="h-10 w-64 bg-gray-700 rounded-lg mb-8"></div>
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-800 p-6 rounded-xl h-40 shadow-lg">
                    <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-6"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6 mb-6"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-700 rounded-full w-16"></div>
                      <div className="h-6 bg-gray-700 rounded-full w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar - loading state */}
          <div className="w-full lg:w-1/4">
            <div className="animate-pulse">
              <div className="bg-gray-800 p-6 rounded-xl mb-6">
                <div className="h-12 bg-gray-700 rounded-lg mb-6"></div>
                <div className="h-8 bg-gray-700 rounded mb-4"></div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-700 rounded-full w-16"></div>
                  ))}
                </div>
                <div className="h-8 bg-gray-700 rounded mb-4"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-700 rounded-full w-16"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Find Your <span className="text-indigo-400">Dream Job</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Browse through our curated list of available positions in tech and digital industries
          </p>
        </div>

        {/* Main content and sidebar layout */}
        <div className="flex flex-col-reverse lg:flex-row gap-8">
          {/* Main content - Job listings */}
          <div className="w-full lg:w-3/4">
            {/* Results count */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Available Positions</h2>
              <p className="text-gray-400">
                Showing <span className="text-white font-medium">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'job' : 'jobs'}
              </p>
            </div>
            
            {/* Job Listings */}
            {filteredJobs.length > 0 ? (
              <div className="space-y-6">
                {filteredJobs.map(job => (
                  <Link 
                    href={`/jobs/${job._id}`}
                    key={job._id} 
                    className="block bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 hover:bg-gray-750 transition-all duration-200 border border-gray-700 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors">{job.title}</h2>
                      <span className="bg-green-900/70 text-green-300 text-xs px-3 py-1 rounded-full font-medium">
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-400 mb-4">
                      <Briefcase size={16} className="mr-2" />
                      <span className="mr-3">{job.company}</span>
                      <MapPin size={16} className="mr-2" />
                      <span>{job.location}</span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-5 line-clamp-3">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {job.techStack.slice(0, 5).map(tech => (
                        <span key={tech} className="bg-gray-700/70 text-xs text-indigo-300 px-2.5 py-1 rounded-full">
                          {tech}
                        </span>
                      ))}
                      {job.techStack.length > 5 && (
                        <span className="bg-gray-700/70 text-xs text-gray-400 px-2.5 py-1 rounded-full">
                          +{job.techStack.length - 5}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-400 border-t border-gray-700/50 pt-3">
                      <span className="flex items-center">
                        {job.employmentType || 'Full-time'}
                      </span>
                      <span className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 p-10 text-center rounded-xl border border-gray-700 shadow-lg">
                <div className="flex flex-col items-center">
                  <div className="bg-gray-700/50 p-4 rounded-full mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No matching jobs found</h3>
                  <p className="text-gray-400 mb-6">Try adjusting your search filters to find more opportunities</p>
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar - Search and Filters */}
          <div className="w-full lg:w-1/4 mb-6 lg:mb-0">
            {/* Search */}
            <div className="bg-gray-800 p-5 rounded-xl mb-6 border border-gray-700 shadow-lg">
              <h3 className="text-lg font-medium text-white mb-4">Search Jobs</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Job title, keywords..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/70 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
              <div 
                className="p-5 border-b border-gray-700 flex justify-between items-center cursor-pointer"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
              >
                <div className="flex items-center">
                  <Filter size={18} className="text-indigo-400 mr-2" />
                  <h3 className="text-lg font-medium text-white">Filters</h3>
                </div>
                <ChevronDown 
                  size={18} 
                  className={`transition-transform duration-200 text-gray-400 ${filtersExpanded ? 'rotate-180' : ''}`} 
                />
              </div>
              
              {filtersExpanded && (
                <div className="p-5 space-y-6">
                  {/* Tech Stack Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex justify-between">
                      Skills & Technologies
                      {filters.techStack.length > 0 && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                          {filters.techStack.length}
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {allTechTags.slice(0, 15).map(tech => (
                        <button
                          key={tech}
                          onClick={() => toggleTechFilter(tech)}
                          className={`px-2 py-1 text-xs rounded-full transition-all duration-200 ${
                            filters.techStack.includes(tech)
                              ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20'
                              : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          {tech}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Experience Level Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex justify-between">
                      Experience Level
                      {filters.experienceLevel && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                          1
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {experienceLevels.map(level => (
                        <button
                          key={level}
                          onClick={() => setExperienceLevel(level)}
                          className={`px-2 py-1 text-xs rounded-full transition-all duration-200 ${
                            filters.experienceLevel === level
                              ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20'
                              : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Employment Type Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex justify-between">
                      Employment Type
                      {filters.employmentType && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                          1
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {employmentTypes.map(type => (
                        <button
                          key={type}
                          onClick={() => setEmploymentType(type)}
                          className={`px-2 py-1 text-xs rounded-full transition-all duration-200 ${
                            filters.employmentType === type
                              ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20'
                              : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Clear Filters Button */}
                  {activeFiltersCount > 0 && (
                    <div className="pt-2 border-t border-gray-700">
                      <button
                        onClick={clearAllFilters}
                        className="w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={14} />
                        Clear all filters ({activeFiltersCount})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
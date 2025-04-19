"use client";
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiBriefcase, FiMapPin, FiDollarSign, FiCalendar, FiUsers } from 'react-icons/fi';

// Type definitions
interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  postedDate: string;
  deadline: string;
  status: 'active' | 'draft' | 'expired';
}

// Sample initial data
const initialJobs: JobPosting[] = [
  {
    id: '1',
    title: 'Senior Full Stack Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA (Remote)',
    employmentType: 'Full-time',
    salary: '$120,000 - $150,000',
    description: 'We are looking for an experienced Full Stack Developer to join our growing team. The ideal candidate should have strong experience with React, Node.js, and cloud infrastructure.',
    requirements: [
      'At least 5 years of experience in web development',
      'Strong proficiency in JavaScript, TypeScript, React, and Node.js',
      'Experience with cloud platforms (AWS, Azure, or GCP)',
      'Knowledge of CI/CD pipelines and DevOps principles'
    ],
    responsibilities: [
      'Develop and maintain web applications using React and Node.js',
      'Collaborate with cross-functional teams to define and design new features',
      'Optimize applications for maximum speed and scalability',
      'Implement security and data protection measures'
    ],
    postedDate: '2025-04-10',
    deadline: '2025-05-10',
    status: 'active'
  },
  {
    id: '2',
    title: 'Machine Learning Engineer',
    company: 'AI Solutions Ltd.',
    location: 'Boston, MA',
    employmentType: 'Full-time',
    salary: '$130,000 - $160,000',
    description: 'Join our innovative AI team to build next-generation machine learning models for our product suite.',
    requirements: [
      'Masters or PhD in Computer Science, Machine Learning, or related field',
      'Experience with Python and machine learning frameworks',
      'Knowledge of deep learning architectures',
      'Proven track record of implementing ML models in production'
    ],
    responsibilities: [
      'Research and implement machine learning algorithms',
      'Work with data scientists to improve model accuracy',
      'Deploy models to production environments',
      'Stay updated with latest ML research and techniques'
    ],
    postedDate: '2025-04-05',
    deadline: '2025-05-05',
    status: 'active'
  }
];

export default function AdminJobsPage() {
  // State for jobs list and form
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // State for new/editing job
  const [jobForm, setJobForm] = useState<Omit<JobPosting, 'id'>>({
    title: '',
    company: '',
    location: '',
    employmentType: '',
    salary: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    postedDate: '2025-04-17', // Use a fixed date for SSR consistency
    deadline: '',
    status: 'draft'
  });

  // Reset form when closing
  useEffect(() => {
    if (!isFormOpen) {
      setEditingJobId(null);
      setJobForm({
        title: '',
        company: '',
        location: '',
        employmentType: '',
        salary: '',
        description: '',
        requirements: [''],
        responsibilities: [''],
        postedDate: '2025-04-17', // Use a fixed date for SSR consistency
        deadline: '',
        status: 'draft'
      });
    }
  }, [isFormOpen]);

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load job data for editing
  const editJob = (jobId: string) => {
    const jobToEdit = jobs.find(job => job.id === jobId);
    if (jobToEdit) {
      setJobForm({
        title: jobToEdit.title,
        company: jobToEdit.company,
        location: jobToEdit.location,
        employmentType: jobToEdit.employmentType,
        salary: jobToEdit.salary,
        description: jobToEdit.description,
        requirements: [...jobToEdit.requirements],
        responsibilities: [...jobToEdit.responsibilities],
        postedDate: jobToEdit.postedDate,
        deadline: jobToEdit.deadline,
        status: jobToEdit.status
      });
      setEditingJobId(jobId);
      setIsFormOpen(true);
    }
  };

  // Delete a job
  const deleteJob = (jobId: string) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      setJobs(jobs.filter(job => job.id !== jobId));
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJobForm({ ...jobForm, [name]: value });
  };

  // Handle array field changes (requirements, responsibilities)
  const handleArrayChange = (index: number, value: string, field: 'requirements' | 'responsibilities') => {
    const updatedArray = [...jobForm[field]];
    updatedArray[index] = value;
    setJobForm({ ...jobForm, [field]: updatedArray });
  };

  // Add new item to array fields
  const addArrayItem = (field: 'requirements' | 'responsibilities') => {
    setJobForm({ ...jobForm, [field]: [...jobForm[field], ''] });
  };

  // Remove item from array fields
  const removeArrayItem = (index: number, field: 'requirements' | 'responsibilities') => {
    if (jobForm[field].length > 1) {
      const updatedArray = jobForm[field].filter((_, i) => i !== index);
      setJobForm({ ...jobForm, [field]: updatedArray });
    }
  };

  // Save new or updated job
  const saveJob = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty array items
    const requirements = jobForm.requirements.filter(req => req.trim() !== '');
    const responsibilities = jobForm.responsibilities.filter(resp => resp.trim() !== '');
    
    if (editingJobId) {
      // Update existing job
      setJobs(jobs.map(job => 
        job.id === editingJobId 
          ? { ...job, ...jobForm, requirements, responsibilities } 
          : job
      ));
    } else {
      // Create new job with generated ID
      const newJob: JobPosting = {
        id: Date.now().toString(),
        ...jobForm,
        requirements,
        responsibilities
      };
      setJobs([...jobs, newJob]);
    }
    
    setIsFormOpen(false);
  };

  const handleJobClick = (job: JobPosting) => {
    setSelectedJob(job);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Admin Dashboard - Job Postings | DevProfile AI</title>
        <meta name="description" content="Manage job postings for the AI-powered developer profile analyzer" />
      </Head>

      {/* Admin Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Job Postings Management</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiPlus className="mr-2" /> Add New Job
              </button>
              <img 
                src="./profile.png" 
                alt="Profile Logo" 
                className="w-10 h-10 rounded-full cursor-pointer" 
                onClick={() => window.location.href = '/hr-profile'}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search jobs by title or company..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Job Listings Table */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleJobClick(job)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.location}</div>
                    <div className="text-sm text-gray-500">{job.employmentType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${job.status === 'active' ? 'bg-green-100 text-green-800' : 
                        job.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.postedDate).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.deadline).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => editJob(job.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <FiEdit className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => deleteJob(job.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No job postings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedJob && (
          <div className="bg-gray-100 mt-6 p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Job Description</h3>
            <p className="text-gray-700">{selectedJob.description}</p>
          </div>
        )}

        {/* Job Posting Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full" role="dialog" aria-modal="true">
                <form onSubmit={saveJob}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="mb-5">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {editingJobId ? 'Edit Job Posting' : 'Create New Job Posting'}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* Job Title */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title*</label>
                        <input
                          type="text"
                          name="title"
                          id="title" 
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={jobForm.title}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      {/* Company */}
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company*</label>
                        <input
                          type="text"
                          name="company"
                          id="company" 
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={jobForm.company}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      {/* Location */}
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location*</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiMapPin className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="location"
                            id="location" 
                            required
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            placeholder="City, State (Remote optional)"
                            value={jobForm.location}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      {/* Employment Type */}
                      <div>
                        <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">Employment Type*</label>
                        <select
                          id="employmentType"
                          name="employmentType"
                          required
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={jobForm.employmentType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Temporary">Temporary</option>
                          <option value="Internship">Internship</option>
                        </select>
                      </div>
                      
                      {/* Salary */}
                      <div>
                        <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Salary Range</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiDollarSign className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="salary"
                            id="salary"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            placeholder="$100,000 - $120,000"
                            value={jobForm.salary}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status*</label>
                        <select
                          id="status"
                          name="status"
                          required
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={jobForm.status}
                          onChange={handleInputChange}
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                      
                      {/* Dates */}
                      <div>
                        <label htmlFor="postedDate" className="block text-sm font-medium text-gray-700">Posted Date*</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiCalendar className="text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="postedDate"
                            id="postedDate"
                            required
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            value={jobForm.postedDate}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Application Deadline*</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiCalendar className="text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="deadline"
                            id="deadline"
                            required
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            value={jobForm.deadline}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Job Description */}
                    <div className="mt-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">Job Description*</label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          name="description"
                          rows={4}
                          required
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Describe the role and responsibilities"
                          value={jobForm.description}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    {/* Requirements */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700">Requirements*</label>
                      <p className="text-xs text-gray-500 mt-1">List the qualifications and skills needed for this position</p>
                      
                      {jobForm.requirements.map((requirement, index) => (
                        <div key={`req-${index}`} className="flex mt-2">
                          <input
                            type="text"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="e.g., 3+ years experience with React"
                            value={requirement}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem(index, 'requirements')}
                            className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => addArrayItem('requirements')}
                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiPlus className="h-4 w-4 mr-1" /> Add Requirement
                      </button>
                    </div>
                    
                    {/* Responsibilities */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700">Responsibilities*</label>
                      <p className="text-xs text-gray-500 mt-1">List the key responsibilities for this role</p>
                      
                      {jobForm.responsibilities.map((responsibility, index) => (
                        <div key={`resp-${index}`} className="flex mt-2">
                          <input
                            type="text"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="e.g., Develop and maintain web applications"
                            value={responsibility}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'responsibilities')}
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem(index, 'responsibilities')}
                            className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => addArrayItem('responsibilities')}
                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FiPlus className="h-4 w-4 mr-1" /> Add Responsibility
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingJobId ? 'Update Job' : 'Create Job'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
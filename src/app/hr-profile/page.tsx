"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link'; // For Job Posting link
import { SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { HRProfileClientData, IHRProfile } from '@/models/HRprofile'; // Import types

// Define the shape of profile data used in the component state
// It can be the full MongoDB doc (IHRProfile) or null initially
type ProfileState = IHRProfile | null;
// Define the shape of data being edited (subset of fields)
type EditDataState = Partial<HRProfileClientData>;

// Define a job interface for type safety
interface JobListing {
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

// --- Reusable Input Component (Optional but good practice) ---
interface InputFieldProps {
  label: string;
  id: string;
  name: keyof EditDataState; // Use keyof for type safety
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, name, value, onChange, type = "text", placeholder, required = false, disabled = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
    />
  </div>
);

// Job card component to display essential job details
const JobCard = ({ job }: { job: JobListing }) => (
  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors shadow-md">
    <div className="flex items-start justify-between">
      <h3 className="text-lg font-semibold text-indigo-300">{job.title}</h3>
      <span className={`text-xs px-2 py-1 rounded-full ${
        job.status === 'Open' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
      }`}>
        {job.status}
      </span>
    </div>
    
    <p className="text-sm text-gray-400 mt-1">{job.location}</p>
    
    <div className="mt-3">
      <p className="text-sm text-gray-300 line-clamp-2">{job.description}</p>
    </div>
    
    {(job.salaryMin || job.salaryMax) && (
      <p className="text-sm text-gray-400 mt-2">
        Salary: {job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : ''}
        {job.salaryMin && job.salaryMax ? ' - ' : ''}
        {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : ''}
      </p>
    )}
    
    <div className="mt-3 flex flex-wrap gap-1">
      {job.techStack.slice(0, 4).map((tech) => (
        <span key={tech} className="px-2 py-0.5 bg-gray-700 text-xs text-indigo-300 rounded-full">
          {tech}
        </span>
      ))}
      {job.techStack.length > 4 && (
        <span className="px-2 py-0.5 bg-gray-700 text-xs text-gray-400 rounded-full">
          +{job.techStack.length - 4} more
        </span>
      )}
    </div>
    
    <div className="mt-3 pt-2 border-t border-gray-700 flex justify-between items-center">
      <span className="text-xs text-gray-400">
        Posted: {new Date(job.createdAt).toLocaleDateString()}
      </span>
      <div className="flex space-x-2">
        <Link href={`/hr/jobs/${job._id}/edit`} className="text-xs text-blue-400 hover:text-blue-300">
          Edit
        </Link>
        <Link href={`/hr/jobs/${job._id}`} className="text-xs text-indigo-400 hover:text-indigo-300">
          View Details →
        </Link>
      </div>
    </div>
  </div>
);

// --- Main Profile Page Component ---
export default function HRProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const user = session?.user as SessionUser | undefined;

  const [profile, setProfile] = useState<ProfileState>(null);
  const [editData, setEditData] = useState<EditDataState>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // New state for jobs
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // --- Authentication and Authorization ---
  useEffect(() => {
    if (status === "loading") return; // Wait until session status is determined

    if (status === "unauthenticated") {
      router.replace('/auth/signin?callbackUrl=/hr/profile'); // Redirect to signin
      return;
    }
    // If authenticated, but not HR
    if (status === "authenticated" && user?.role !== 'hr') {
      toast.error("Access Denied: HR role required.");
      router.replace('/'); // Redirect to home or another appropriate page
      return;
    }
    // If authenticated as HR, proceed to fetch data
    if (status === "authenticated" && user?.role === 'hr') {
       setIsLoading(true); // Start loading profile data
    }
  }, [status, user, router]);

  // --- Fetch HR Profile Data ---
  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
        console.warn("User ID not available yet for fetching profile.");
        return;
    }

    console.log("Fetching profile for user:", user.email);
    setFetchError(null); // Reset error before fetch
    try {
      const response = await fetch(`/api/hr-profile?email=${encodeURIComponent(user.email!)}`);

      if (response.status === 404) {
        console.log("Profile not found, allowing creation.");
        setProfile(null); // Explicitly set profile to null
        setEditData({ email: user.email });
        setIsEditing(true); // Go directly to edit mode to create profile
        toast.info("Create your HR profile.");
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch profile (status: ${response.status})`);
      } else {
        const data: IHRProfile = await response.json();
        setProfile(data);
        setEditData({
          email: data.email,
          name: data.name,
          company: data.company,
          department: data.department,
          phone: data.phone,
          photo: data.photo,
        });
        setIsEditing(false); // Start in view mode if profile exists
      }
    } catch (err: any) {
      console.error("Error fetching HR profile:", err);
      setFetchError(`Could not load your profile: ${err.message}`);
      toast.error(`Could not load your profile: ${err.message}`);
      setProfile(null); // Ensure profile is null on error
      setEditData({ email: user?.email }); // Reset edit data but keep email
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (status === "authenticated" && user?.role === 'hr' && user?.id) {
      fetchProfile();
    }
    if (status !== "loading" && (status === "unauthenticated" || user?.role !== 'hr')) {
         setIsLoading(false);
    }
  }, [status, user, fetchProfile]);

  // --- Fetch Posted Jobs ---
  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;
    
    setJobsLoading(true);
    try {
      const response = await fetch('/api/jobs');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs (status: ${response.status})`);
      }
      
      const jobsData: JobListing[] = await response.json();
      setJobs(jobsData);
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      toast.error(`Could not load your posted jobs: ${err.message}`);
    } finally {
      setJobsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (status === "authenticated" && user?.role === 'hr' && user?.id && !isEditing && !isLoading) {
      fetchJobs();
    }
  }, [status, user, fetchJobs, isEditing, isLoading]);

  // --- Input Change Handler ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // --- Save Handler ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !user?.email) {
        toast.error("Cannot save profile. User information is missing.");
        return;
    }
    setIsSaving(true);

    const payload: HRProfileClientData = {
        email: editData.email || user.email,
        name: editData.name,
        company: editData.company,
        department: editData.department,
        phone: editData.phone,
        photo: editData.photo,
    };

    try {
      const response = await fetch('/api/hr-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save profile (status: ${response.status})`);
      }

      const updatedProfile: IHRProfile = await response.json();
      setProfile(updatedProfile);
      setEditData({
         email: updatedProfile.email,
         name: updatedProfile.name,
         company: updatedProfile.company,
         department: updatedProfile.department,
         phone: updatedProfile.phone,
         photo: updatedProfile.photo,
      });
      setIsEditing(false);
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      console.error("Error saving HR profile:", err);
      toast.error(`Failed to save profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Cancel Edit Handler ---
   const handleCancelEdit = () => {
        setIsEditing(false);
        if (profile) {
             setEditData({
                 email: profile.email,
                 name: profile.name,
                 company: profile.company,
                 department: profile.department,
                 phone: profile.phone,
                 photo: profile.photo,
             });
        } else {
             setEditData({ email: user?.email });
        }
   };

  // --- Render Loading State ---
  if (isLoading) {
    return (
        <div className="container mx-auto p-6 max-w-3xl text-center">
            <div className="animate-pulse text-gray-400">Loading profile...</div>
        </div>
    );
  }

  // --- Render Error State ---
  if (fetchError) {
    return (
        <div className="container mx-auto p-6 max-w-3xl bg-red-900 border border-red-700 text-white rounded-lg shadow-xl mt-10">
            <h2 className="text-xl font-semibold mb-4">Error Loading Profile</h2>
            <p className="mb-4">{fetchError}</p>
            <button
              onClick={fetchProfile}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition"
            >
              Retry
            </button>
        </div>
    );
  }

  // --- Render Access Denied (Should be handled by redirect, but as fallback) ---
  if (status !== "authenticated" || user?.role !== 'hr') {
     return <div className="p-6 text-center text-red-500">Access Denied. Please sign in as an HR user.</div>;
  }

  // --- Render Profile View/Edit ---
  const displayData = profile || { email: user?.email };

  return (
    <div className="container mx-auto p-6 max-w-4xl bg-gray-900 text-gray-100 rounded-lg shadow-xl mt-10">
       <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-indigo-400">
            {isEditing ? (profile ? 'Edit Your Profile' : 'Create Your Profile') : 'Your HR Profile'}
        </h1>
        {!isEditing && (
            <Link href="/hr/post-job" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition text-sm font-medium">
                Post a New Job
            </Link>
        )}
       </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <p className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400">
                {editData.email || user?.email || 'N/A'}
              </p>
          </div>

          <InputField
            label="Name"
            id="name"
            name="name"
            value={editData.name}
            onChange={handleInputChange}
            placeholder="Your full name"
            disabled={isSaving}
          />
          <InputField
            label="Company"
            id="company"
            name="company"
            value={editData.company}
            onChange={handleInputChange}
            placeholder="Your company name"
            disabled={isSaving}
          />
          <InputField
            label="Department"
            id="department"
            name="department"
            value={editData.department}
            onChange={handleInputChange}
            placeholder="e.g., Human Resources, Talent Acquisition"
            disabled={isSaving}
          />
          <InputField
            label="Phone"
            id="phone"
            name="phone"
            type="tel"
            value={editData.phone}
            onChange={handleInputChange}
            placeholder="Contact phone number (optional)"
            disabled={isSaving}
          />
          <InputField
            label="Photo URL"
            id="photo"
            name="photo"
            type="url"
            value={editData.photo}
            onChange={handleInputChange}
            placeholder="https://example.com/your-photo.jpg (optional)"
            disabled={isSaving}
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white transition disabled:opacity-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (profile ? 'Save Changes' : 'Create Profile')}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
               <img
                  src={profile?.photo || '/default-avatar.png'}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-600 bg-gray-700"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
               />
               <div>
                  <h2 className="text-xl font-semibold">{profile?.name || <span className='text-gray-400 italic'>Name Not Set</span>}</h2>
                  <p className="text-gray-400">{profile?.email}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-gray-700">
              <div>
                <span className="text-sm font-medium text-gray-400 block mb-1">Company</span>
                <p className="text-gray-100">{profile?.company || <span className='text-gray-500 italic'>Not Set</span>}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-400 block mb-1">Department</span>
                <p className="text-gray-100">{profile?.department || <span className='text-gray-500 italic'>Not Set</span>}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-400 block mb-1">Phone</span>
                <p className="text-gray-100">{profile?.phone || <span className='text-gray-500 italic'>Not Set</span>}</p>
              </div>
            </div>

            {!fetchError && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white transition"
                    disabled={isSaving}
                  >
                    Edit Profile
                  </button>
                </div>
            )}
          </div>

          <div className="mt-10 border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-indigo-400">Your Posted Jobs</h2>
              <button
                onClick={fetchJobs}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                disabled={jobsLoading}
              >
                {jobsLoading ? 'Refreshing...' : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
            
            {jobsLoading ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 w-48 bg-gray-700 rounded"></div>
                </div>
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-4">You haven't posted any jobs yet.</p>
                <Link href="/hr/post-job" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white transition text-sm font-medium">
                  Create Your First Job Post
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
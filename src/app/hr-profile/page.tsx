"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import { HRProfileClientData, IHRProfile } from '@/models/HRProfile'; // Adjust path and ensure these types include new fields

// --- Types ---
type ProfileState = IHRProfile | null;
// Ensure EditDataState includes all potential fields from IHRProfile
type EditDataState = Partial<IHRProfile>;

interface JobListing {
  _id: string;
  title: string;
  company: string; // Usually derived from HR profile, but could be overridden
  location: string;
  description: string;
  techStack: string[];
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string; // e.g., Full-time, Part-time, Contract
  experienceLevel?: string; // e.g., Entry, Mid, Senior
  status: 'Open' | 'Closed' | 'Draft';
  createdAt: string;
  updatedAt: string;
  // applicantCount?: number; // Optional: if your API provides it
}

// --- Reusable Input Components ---
interface InputFieldProps {
  label: string;
  id: string;
  name: keyof EditDataState;
  value: string | number | undefined; // Allow number for potential future use
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  pattern?: string;
  title?: string; // Tooltip for pattern
  autoComplete?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, name, value, onChange, type = "text", placeholder, required = false, disabled = false, pattern, title, autoComplete }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-300">
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
      pattern={pattern}
      title={title}
      autoComplete={autoComplete}
      className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 transition duration-150 ease-in-out focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    />
  </div>
);

interface TextareaFieldProps {
    label: string;
    id: string;
    name: keyof EditDataState;
    value: string | undefined;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    required?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ label, id, name, value, onChange, placeholder, rows = 4, disabled = false, required = false }) => (
    <div className="flex flex-col">
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            id={id}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
            disabled={disabled}
            className="w-full resize-vertical rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 transition duration-150 ease-in-out focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
    </div>
);


// --- Job Card Component ---
const JobCard = ({ job }: { job: JobListing }) => {
  const getStatusColor = (status: JobListing['status']) => {
    switch (status) {
      case 'Open': return 'bg-green-800 text-green-200 border-green-600';
      case 'Closed': return 'bg-red-800 text-red-200 border-red-600';
      case 'Draft': return 'bg-yellow-800 text-yellow-200 border-yellow-600';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  // Placeholder action handlers (replace with actual logic/navigation)
  const handleManageStatus = (jobId: string, newStatus: JobListing['status']) => {
      toast.info(`TODO: Change status of job ${jobId} to ${newStatus}`);
      // Example: API call -> await fetch(`/api/jobs/${jobId}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      // Then potentially call fetchJobs() again to refresh the list.
  };

  return (
    <div className="flex h-full flex-col justify-between space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-lg transition-colors hover:border-indigo-500/80">
       <div>
            <div className="mb-2 flex items-start justify-between">
                <h3 className="mr-2 line-clamp-2 text-lg font-semibold text-indigo-300">{job.title}</h3>
                <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                </span>
            </div>
            <p className="mb-1 flex items-center gap-1 text-sm text-gray-400">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {job.location || 'Location not specified'}
            </p>
            <p className="mb-3 line-clamp-3 text-sm text-gray-300">{job.description}</p>

            {(job.salaryMin || job.salaryMax) && (
            <p className="mb-3 text-sm text-gray-400">
                <span className="font-medium text-gray-300">Salary:</span> {job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : ''}
                {job.salaryMin && job.salaryMax ? ' - ' : ''}
                {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : ''}
                {!job.salaryMin && !job.salaryMax ? 'Not specified' : ''}
            </p>
            )}

            <div className="mb-3 flex flex-wrap gap-1.5">
            {job.techStack?.slice(0, 5).map((tech) => (
                <span key={tech} className="whitespace-nowrap rounded-full bg-gray-700 px-2 py-0.5 text-xs text-indigo-300">
                {tech}
                </span>
            ))}
            {(job.techStack?.length ?? 0) > 5 && (
                <span className="whitespace-nowrap rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                +{(job.techStack?.length ?? 0) - 5} more
                </span>
            )}
             {(job.techStack?.length ?? 0) === 0 && (
                 <span className="whitespace-nowrap rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400 italic">
                    No stack specified
                 </span>
            )}
            </div>
        </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-gray-700/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-400">
                Posted: {new Date(job.createdAt).toLocaleDateString()}
                {/* Optional: Show applicant count */}
                {/* {typeof job.applicantCount === 'number' && <span className="ml-2">| {job.applicantCount} Applicants</span>} */}
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                 <Link href={`/hr/jobs/${job._id}/edit`} className="text-xs text-blue-400 transition-colors hover:text-blue-300">
                    Edit
                </Link>
                <span className='text-xs text-gray-600'>|</span>
                <Link href={`/hr/jobs/${job._id}/applicants`} className="text-xs text-indigo-400 transition-colors hover:text-indigo-300">
                    Applicants
                </Link>
                {/* Example Status Management Links (Could be buttons too) */}
                {job.status === 'Open' && (
                    <>
                    <span className='text-xs text-gray-600'>|</span>
                    <button onClick={() => handleManageStatus(job._id, 'Closed')} className="text-xs text-red-400 transition-colors hover:text-red-300">Mark Closed</button>
                    </>
                )}
                 {job.status === 'Closed' && (
                     <>
                    <span className='text-xs text-gray-600'>|</span>
                    <button onClick={() => handleManageStatus(job._id, 'Open')} className="text-xs text-green-400 transition-colors hover:text-green-300">Re-Open</button>
                     </>
                 )}
                 {/* Add Draft -> Open logic if needed */}
            </div>
      </div>
    </div>
  );
};

// --- Skeleton Loader Components ---
const SkeletonElement = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded bg-gray-700 ${className}`}></div>
);

const ProfileSkeleton = () => (
    <div className="space-y-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
            <SkeletonElement className="h-24 w-24 flex-shrink-0 rounded-full" />
            <div className="w-full space-y-2 sm:w-auto">
                <SkeletonElement className="h-6 w-40" />
                <SkeletonElement className="h-4 w-56" />
            </div>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-gray-700 pt-5 md:grid-cols-2">
            {[...Array(6)].map((_, i) => ( // Match number of fields (Name, Company, Dept, Phone, Website, LinkedIn) + Bio
                <div key={i} className={i === 6 ? 'md:col-span-2' : ''}> {/* Make Bio span full width */}
                    <SkeletonElement className="mb-1 h-4 w-24" />
                    <SkeletonElement className="h-5 w-full" />
                </div>
            ))}
             <div className="md:col-span-2"> {/* Skeleton for Bio */}
                 <SkeletonElement className="mb-1 h-4 w-16" />
                 <SkeletonElement className="h-16 w-full" />
             </div>
        </div>
         <div className="flex justify-end border-t border-gray-700 pt-5">
              <SkeletonElement className="h-10 w-28" />
          </div>
    </div>
);

const JobsSkeleton = () => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
            <div key={i} className="flex h-full flex-col justify-between space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-lg">
                 <div>
                    <div className="mb-2 flex items-start justify-between">
                        <SkeletonElement className="h-5 w-3/5" />
                        <SkeletonElement className="h-5 w-16 rounded-full" />
                    </div>
                    <SkeletonElement className="mb-1 h-4 w-1/3" />
                    <div className="mb-3 space-y-2">
                        <SkeletonElement className="h-3 w-full" />
                        <SkeletonElement className="h-3 w-4/5" />
                    </div>
                    <SkeletonElement className="mb-3 h-4 w-2/5" />
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        <SkeletonElement className="h-5 w-12 rounded-full" />
                        <SkeletonElement className="h-5 w-16 rounded-full" />
                        <SkeletonElement className="h-5 w-14 rounded-full" />
                    </div>
                </div>
                 <div className="mt-auto flex flex-col gap-2 border-t border-gray-700/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <SkeletonElement className="h-3 w-24" />
                    <div className="flex items-center gap-x-2">
                         <SkeletonElement className="h-3 w-8" />
                         <SkeletonElement className="h-3 w-16" />
                         <SkeletonElement className="h-3 w-14" />
                    </div>
                 </div>
            </div>
        ))}
    </div>
);

// --- Main Profile Page Component ---
export default function HRProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as SessionUser | undefined;

  const [profile, setProfile] = useState<ProfileState>(null);
  const [editData, setEditData] = useState<EditDataState>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Combined initial loading
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // --- Authentication & Authorization ---
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace('/auth/signin?callbackUrl=/hr/profile');
      return;
    }
    if (status === "authenticated" && user?.role !== 'hr') {
      toast.error("Access Denied: HR role required.");
      router.replace('/'); // Redirect non-HR users
      return;
    }
    // Set loading state only if authenticated as HR and data hasn't been fetched yet
    if (status === "authenticated" && user?.role === 'hr' && isLoading) {
       // Keep isLoading true until fetchProfile runs and finishes
    } else if (status !== "authenticated" || user?.role !== 'hr') {
        setIsLoading(false); // Not HR, stop loading indicator
    }
  }, [status, user, router, isLoading]); // Added isLoading to dependency

  // --- Fetch HR Profile Data ---
  const fetchProfile = useCallback(async () => {
    if (!user?.id || !user?.email) {
      console.warn("User ID or email not available for fetching profile.");
      setIsLoading(false); // Stop loading if user info isn't ready
      setFetchError("User session details are missing.");
      return;
    }

    console.log("Fetching profile for user:", user.email);
    setFetchError(null);
    // setIsLoading(true); // Ensure loading is true when fetch starts
    try {
      const response = await fetch(`/api/hr-profile?email=${encodeURIComponent(user.email)}`);

      if (!response.ok) {
          if (response.status === 404) {
              console.log("Profile not found, enabling creation mode.");
              setProfile(null);
              setEditData({ email: user.email }); // Pre-fill email
              setIsEditing(true); // Go directly to edit/create mode
              toast.info("Create your HR profile to get started.");
          } else {
              const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
              throw new Error(errorData.error || errorData.message || `Failed to fetch profile (status: ${response.status})`);
          }
      } else {
          const data: IHRProfile = await response.json();
          setProfile(data);
          setEditData(data); // Populate editData with the full fetched profile
          setIsEditing(false); // Start in view mode
      }
    } catch (err: any) {
      console.error("Error fetching HR profile:", err);
      const errorMessage = `Could not load your profile: ${err.message}`;
      setFetchError(errorMessage);
      toast.error(errorMessage);
      setProfile(null);
      setEditData({ email: user?.email }); // Reset edit data, keep email
    } finally {
      setIsLoading(false); // Loading finished (success or error)
    }
  }, [user?.id, user?.email]);

  // Trigger profile fetch when authenticated as HR
  useEffect(() => {
    // Fetch only if authenticated, HR role, user ID exists, and NOT already fetched/fetching
    if (status === "authenticated" && user?.role === 'hr' && user?.id && isLoading) {
      fetchProfile();
    }
  }, [status, user?.id, user?.role, isLoading, fetchProfile]);

  // --- Fetch Posted Jobs ---
  const fetchJobs = useCallback(async (showToast = false) => {
    if (!user?.id || isEditing) return; // Don't fetch jobs if user ID missing or while editing profile

    setJobsLoading(true);
    try {
      // Assume API filters by logged-in user automatically or needs an indicator
      const response = await fetch('/api/jobs?postedBy=me'); // Adjust endpoint as needed

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch jobs (status: ${response.status})`);
      }

      const jobsData: JobListing[] = await response.json();
      setJobs(jobsData);
      if(showToast) toast.success("Job list refreshed.");
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      toast.error(`Could not load your posted jobs: ${err.message}`);
      setJobs([]); // Reset jobs on error
    } finally {
      setJobsLoading(false);
    }
  }, [user?.id, isEditing]);

  // Trigger job fetch when profile is loaded/exists and not editing
  useEffect(() => {
    // Fetch jobs once profile is loaded (isLoading is false) and we are in view mode (!isEditing)
    // Also check profile is not undefined/null if fetch was successful, or if fetch resulted in 404 (profile is null but we allow job fetching)
    if (!isLoading && !isEditing && profile !== undefined && status === "authenticated" && user?.role === 'hr') {
       fetchJobs();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isEditing, profile, status, user?.role]); // Removed fetchJobs from deps to prevent loop, rely on other state changes


  // --- Input Change Handler (Generic) ---
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

    // Ensure email is included, use editData which contains all fields
    const payload: EditDataState = {
      ...editData, // Include all fields from editData
      email: editData.email || user.email, // Prioritize editData.email but fall back to user.email
    };

    // Optional: Add more robust client-side validation here if needed

    try {
      // Use POST for both create and update (API handles upsert logic)
      const response = await fetch('/api/hr-profile', {
        method: 'POST', // Or PUT if your API distinguishes
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save profile (status: ${response.status})`);
      }

      const updatedProfile: IHRProfile = await response.json();
      setProfile(updatedProfile);
      setEditData(updatedProfile); // Sync editData with the newly saved profile
      setIsEditing(false); // Switch back to view mode
      toast.success('Profile saved successfully!');
      // Optionally re-fetch jobs if profile changes might affect job display (e.g., company name)
      // fetchJobs();

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
    // Reset editData to match the current profile state or initial state if creating
    if (profile) {
      setEditData(profile); // Reset to the last known good profile state
    } else {
      // If profile was null (creating), reset to just the email
      setEditData({ email: user?.email });
    }
    setFetchError(null); // Clear any previous fetch errors when cancelling
  };

  // --- Render Logic ---

  // Initial Auth Loading State
  if (status === "loading") {
     return (
        <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center p-6 py-10">
            <div className="text-center text-gray-400">
                {/* Optional: Add a spinner */}
                <p>Authenticating...</p>
            </div>
        </div>
    );
  }

  // Access Denied (Redirect handled earlier, this is a fallback)
  if (status !== "authenticated" || user?.role !== 'hr') {
     return (
         <div className="container mx-auto p-6 py-10 text-center">
             <p className="text-red-500">Access Denied. Please sign in as an HR user.</p>
             <Link href="/auth/signin" className="mt-2 inline-block text-indigo-400 hover:text-indigo-300">
                 Go to Sign In
             </Link>
         </div>
     );
  }

   // Fetch Error State (Only shown if not in initial creation mode)
   if (fetchError && !isEditing && profile === null) { // Show error if fetch failed and we are not creating a profile
     return (
         <div className="container mx-auto mt-10 p-6">
             <div className="rounded-lg border border-red-700 bg-red-900/50 px-4 py-3 text-red-100 shadow-md" role="alert">
                 <strong className="mb-2 block font-bold">Error Loading Profile</strong>
                 <span className="mb-2 block sm:inline">{fetchError}</span>
                 <button
                    onClick={() => { setIsLoading(true); fetchProfile(); }} // Reset loading and retry
                    className="mt-2 rounded bg-red-600 px-4 py-1.5 text-sm text-white transition hover:bg-red-700"
                 >
                    Retry Fetch
                 </button>
             </div>
         </div>
     );
   }

  // Helper to display data or a placeholder, handling links for URLs
  const DisplayData = ({ label, value, isLink = false, linkPrefix = '', placeholder = "Not Set" }: { label: string, value: string | undefined | null; isLink?: boolean; linkPrefix?: string; placeholder?: string }) => {
      const displayValue = value || '';
      const fullLink = isLink && displayValue ? (displayValue.startsWith('http') ? displayValue : `${linkPrefix}${displayValue}`) : '#';
      const linkText = isLink && displayValue ? (displayValue.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]) : ''; // Basic attempt to shorten display link

      return (
        <div>
            <span className="mb-0.5 block text-sm font-medium text-gray-400">{label}</span>
            {isLink && value ? (
                <a href={fullLink} target="_blank" rel="noopener noreferrer" className="break-words text-indigo-400 transition-colors hover:text-indigo-300 hover:underline" title={fullLink}>
                    {linkText || displayValue} <span className='text-xs'>↗</span>
                </a>
            ) : value ? (
                <span className="text-gray-100">{value}</span>
            ) : (
                <span className='italic text-gray-500'>{placeholder}</span>
            )}
        </div>
      );
  };

  // Calculate Stats
  const totalJobs = jobs.length;
  const openJobs = jobs.filter(job => job.status === 'Open').length;

  // ***** Main Container: Removed max-w-5xl *****
  return (
    // Apply container, centering, padding, and spacing between sections
    <div className="container mx-auto space-y-8 p-4 md:p-6 lg:p-8">

      {/* Profile Section Card */}
      <div className="overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900 text-gray-100 shadow-xl">
         <div className="p-5 md:p-6 lg:p-8"> {/* Responsive Padding */}
            <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-gray-700 pb-4 sm:flex-row sm:items-center">
                <h1 className="text-2xl font-bold text-indigo-400">
                    {isEditing ? (profile ? 'Edit Your Profile' : 'Create Your Profile') : 'Your HR Profile'}
                </h1>
                {!isEditing && !isLoading && ( // Show Post Job button only in view mode & when not loading
                     <Link href="/hr/post-job" className="w-full shrink-0 rounded-md bg-green-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-green-700 sm:w-auto">
                        Post a New Job
                    </Link>
                )}
            </div>

            {isLoading ? (
                <ProfileSkeleton />
            ) : isEditing ? (
                // --- Edit Form ---
                <form onSubmit={handleSave} className="space-y-5">
                    {/* Email (Non-editable) */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-400">Email</label>
                        <p className="cursor-not-allowed rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-gray-400">
                            {editData.email || user?.email || 'N/A'}
                        </p>
                    </div>

                    {/* Editable Fields Grid */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                        <InputField label="Name" id="name" name="name" value={editData.name} onChange={handleInputChange} placeholder="Your full name" disabled={isSaving} autoComplete="name" />
                        <InputField label="Company" id="company" name="company" value={editData.company} onChange={handleInputChange} placeholder="Company name" disabled={isSaving} autoComplete="organization" />
                        <InputField label="Department" id="department" name="department" value={editData.department} onChange={handleInputChange} placeholder="e.g., Talent Acquisition" disabled={isSaving} autoComplete="organization-title" />
                        <InputField label="Phone" id="phone" name="phone" type="tel" value={editData.phone} onChange={handleInputChange} placeholder="Contact phone (optional)" disabled={isSaving} autoComplete="tel" />
                         <InputField
                             label="Photo URL" id="photo" name="photo" type="url"
                             value={editData.photo} onChange={handleInputChange}
                             placeholder="https://example.com/your-photo.jpg" disabled={isSaving}
                             pattern="https?://.*" title="Please enter a valid URL (http:// or https://)"
                         />
                         <InputField
                             label="Company Website" id="companyWebsite" name="companyWebsite" type="url"
                             value={editData.companyWebsite} onChange={handleInputChange}
                             placeholder="https://yourcompany.com" disabled={isSaving}
                             pattern="https?://.*" title="Please enter a valid URL (http:// or https://)"
                             autoComplete="url"
                         />
                         <InputField
                             label="LinkedIn Profile" id="linkedinProfile" name="linkedinProfile" type="url"
                             value={editData.linkedinProfile} onChange={handleInputChange}
                             placeholder="https://linkedin.com/in/yourprofile" disabled={isSaving}
                             pattern="https?://(www\.)?linkedin\.com/.*" title="Please enter a valid LinkedIn profile URL (linkedin.com/...)"
                             autoComplete="url"
                         />
                    </div>
                     {/* Bio Text Area */}
                     <TextareaField
                         label="Bio / About" id="bio" name="bio"
                         value={editData.bio} onChange={handleInputChange}
                         placeholder="Share a bit about your role or company culture (optional)"
                         disabled={isSaving}
                         rows={4}
                    />

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 border-t border-gray-700 pt-5">
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="rounded-md bg-gray-600 px-5 py-2 text-white transition duration-150 ease-in-out hover:bg-gray-500 disabled:opacity-50"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex min-w-[120px] items-center justify-center rounded-md bg-indigo-600 px-5 py-2 text-white transition duration-150 ease-in-out hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                                </>
                            ) : (profile ? 'Save Changes' : 'Create Profile')}
                        </button>
                    </div>
                </form>
            ) : (
                // --- View Mode ---
                <div className="space-y-6">
                     {/* Profile Header */}
                     <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                         <img
                            src={profile?.photo || '/images/default-avatar.png'} // Adjust path as needed
                            alt="Profile Avatar"
                            // Increased size and added subtle ring
                            className="h-28 w-28 flex-shrink-0 rounded-full border-2 border-indigo-600/50 object-cover bg-gray-700 ring-2 ring-gray-800"
                            onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; e.currentTarget.onerror = null; }}
                         />
                         <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-semibold md:text-3xl">
                                <DisplayData label="" value={profile?.name} placeholder="Name Not Set" />
                            </h2>
                            <p className="text-gray-400">
                                 <DisplayData label="" value={profile?.email} placeholder="Email Not Set"/>
                            </p>
                         </div>
                     </div>

                    {/* Profile Details Grid */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-gray-700 pt-6 md:grid-cols-2">
                        <DisplayData label="Company" value={profile?.company} />
                        <DisplayData label="Department" value={profile?.department} />
                        <DisplayData label="Phone" value={profile?.phone} />
                        <DisplayData label="Company Website" value={profile?.companyWebsite} isLink={true} linkPrefix="https://" />
                        <DisplayData label="LinkedIn Profile" value={profile?.linkedinProfile} isLink={true} linkPrefix="https://" />
                    </div>

                     {/* Bio Section */}
                     {(profile?.bio) && (
                         <div className="border-t border-gray-700 pt-6">
                            <span className="mb-1 block text-sm font-medium text-gray-400">Bio / About</span>
                            {/* Use whitespace-pre-wrap to respect line breaks */}
                            <p className="whitespace-pre-wrap text-gray-200">{profile.bio}</p>
                         </div>
                     )}

                    {/* Edit Button Area */}
                    {!fetchError && profile && ( // Show Edit only if profile exists and no fetch error occurred
                        <div className="flex justify-end border-t border-gray-700 pt-6">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="rounded-md bg-indigo-600 px-5 py-2 text-white transition duration-150 ease-in-out hover:bg-indigo-700"
                                disabled={isSaving} // Should be impossible here, but safe
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}
                     {!fetchError && !profile && !isLoading && ( // Prompt to create if fetch succeeded but no profile found (404 handled)
                        <div className="flex justify-center border-t border-gray-700 pt-6">
                             <button
                                onClick={() => setIsEditing(true)}
                                className="rounded-md bg-indigo-600 px-5 py-2 text-white transition duration-150 ease-in-out hover:bg-indigo-700"
                            >
                                Create Your Profile
                            </button>
                        </div>
                     )}
                </div>
            )}
         </div>
      </div> {/* End Profile Section Card */}

      {/* Job Dashboard Section - Show only in view mode and if not initial loading */}
      {!isEditing && !isLoading && (
        <div className="overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900 text-gray-100 shadow-xl">
            <div className="p-5 md:p-6 lg:p-8"> {/* Responsive Padding */}
                <div className="mb-5 flex flex-col items-start justify-between gap-4 border-b border-gray-700 pb-4 sm:flex-row sm:items-center">
                    <h2 className="text-xl font-semibold text-indigo-400">Your Dashboard</h2>
                    <button
                        onClick={() => fetchJobs(true)} // Pass true to show toast on manual refresh
                        className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-gray-600 px-3 py-1.5 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white disabled:cursor-wait disabled:opacity-50 sm:self-center"
                        disabled={jobsLoading}
                        aria-label="Refresh job list"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {jobsLoading ? 'Refreshing...' : 'Refresh Jobs'}
                    </button>
                </div>

                {/* Stats Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {/* Stat Card Example */}
                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
                        <span className="block text-3xl font-bold text-indigo-300">{jobsLoading ? '...' : totalJobs}</span>
                        <span className="text-xs text-gray-400">Total Jobs Posted</span>
                    </div>
                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
                        <span className="block text-3xl font-bold text-green-400">{jobsLoading ? '...' : openJobs}</span>
                        <span className="text-xs text-gray-400">Active Jobs</span>
                    </div>
                    {/* Add more stats cards here */}
                    {/* Example: Placeholder for applicants */}
                    {/* <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
                        <span className="block text-3xl font-bold text-blue-400">{jobsLoading ? '...' : 'N/A'}</span>
                        <span className="text-xs text-gray-400">Total Applicants</span>
                    </div> */}
                </div>

                {/* Job Listings */}
                <h3 className="mb-4 mt-2 text-lg font-semibold text-indigo-400">Your Posted Jobs</h3>
                {jobsLoading ? (
                    <JobsSkeleton />
                ) : jobs.length > 0 ? (
                    // Responsive grid for job cards
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {jobs.map(job => (
                           <JobCard key={job._id} job={job} />
                        ))}
                    </div>
                ) : (
                    // Empty state for jobs
                    <div className="rounded-lg border border-dashed border-gray-700 bg-gray-800/50 p-8 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <p className="mt-4 text-gray-400">You haven't posted any jobs yet.</p>
                        {profile && ( // Only show "Post Job" if profile exists
                            <Link href="/hr/post-job" className="mt-5 inline-block rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
                                Post Your First Job
                            </Link>
                        )}
                         {!profile && ( // Prompt to create profile if needed before posting job
                             <p className="mt-2 text-sm text-yellow-400">Please create your profile before posting jobs.</p>
                         )}
                    </div>
                )}
            </div>
        </div> // End Job Dashboard Section Card
      )}

    </div> // End Main Container
  );
}
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import { JobPostClientData, PREDEFINED_TECH_TAGS, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS } from '@/models/Job'; // Adjust path
import { IHRProfile } from '@/models/HRProfile'; // Adjust path

// --- Reusable Input Components ---
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, id, error, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      id={id}
      {...props}
      className={`w-full px-3 py-2 bg-gray-800 border ${error ? 'border-red-500' : 'border-gray-700'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}
const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, id, error, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <textarea
      id={id}
      rows={6}
      {...props}
      className={`w-full px-3 py-2 bg-gray-800 border ${error ? 'border-red-500' : 'border-gray-700'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly string[];
  error?: string;
}
const SelectField: React.FC<SelectFieldProps> = ({ label, id, options, error, ...props }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <select
        id={id}
        {...props}
        className={`w-full px-3 py-2 bg-gray-800 border ${error ? 'border-red-500' : 'border-gray-700'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <option value="">Select...</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
);


// --- Main Post Job Page Component ---
export default function PostJobPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as SessionUser | undefined;

  const initialFormData: JobPostClientData = {
    title: '',
    company: '',
    location: '',
    description: '',
    techStack: [],
    salaryMin: undefined,
    salaryMax: undefined,
    employmentType: '',
    experienceLevel: '',
  };

  const [formData, setFormData] = useState<JobPostClientData>(initialFormData);
  const [techStackInput, setTechStackInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof JobPostClientData | 'techStackInput' | 'form', string>>>({});
  const [isFetchingProfile, setIsFetchingProfile] = useState(false); // For pre-filling company

  // --- Authentication & Authorization ---
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || (status === "authenticated" && user?.role !== 'hr')) {
      toast.warn("Please sign in as an HR user to post jobs.");
      router.replace('/auth/signin?callbackUrl=/hr/post-job');
    }
  }, [session, status, user, router]);

  // --- Fetch HR Profile to pre-fill Company ---
  const fetchHRProfile = useCallback(async () => {
    if (user?.id) {
        setIsFetchingProfile(true);
        try {
            const response = await fetch('/api/hr-profile'); // GET request
            if (response.ok) {
                const profile: IHRProfile = await response.json();
                if (profile?.company) {
                    setFormData(prev => ({ ...prev, company: profile.company || '' }));
                }
            } else if (response.status !== 404) {
                // Don't block on error, just log it
                console.warn("Could not fetch HR profile to pre-fill company:", response.statusText);
            }
        } catch (error) {
             console.error("Error fetching HR profile:", error);
        } finally {
             setIsFetchingProfile(false);
        }
    }
  }, [user?.id]);

  useEffect(() => {
      if (status === "authenticated" && user?.role === 'hr') {
          fetchHRProfile();
      }
  }, [status, user, fetchHRProfile]);

  // --- Input Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name as keyof JobPostClientData]: undefined }));
  };

  const handleTechStackInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTechStackInput(e.target.value);
     setErrors(prev => ({ ...prev, techStackInput: undefined }));
  };

  const addTechTag = (tagToAdd: string) => {
     const newTag = tagToAdd.trim();
     if (newTag && !formData.techStack.some(tag => tag.toLowerCase() === newTag.toLowerCase())) {
        setFormData(prev => ({ ...prev, techStack: [...prev.techStack, newTag] }));
        setTechStackInput(''); // Clear input after adding
        setErrors(prev => ({ ...prev, techStack: undefined })); // Clear techStack error
     } else if (!newTag) {
         setErrors(prev => ({ ...prev, techStackInput: 'Tag cannot be empty.' }));
     } else {
          setErrors(prev => ({ ...prev, techStackInput: 'Tag already added.' }));
     }
  };

  const handleAddTechTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault(); // Prevent form submission on Enter
          addTechTag(techStackInput);
      }
  };

  const handleAddTechTagClick = () => {
      addTechTag(techStackInput);
  };

  const removeTechTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(tag => tag !== tagToRemove),
    }));
  };

  // --- Form Validation ---
   const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof JobPostClientData | 'techStack' | 'form', string>> = {};
        let isValid = true;

        if (!formData.title.trim()) { newErrors.title = 'Job title is required.'; isValid = false; }
        if (!formData.company.trim()) { newErrors.company = 'Company name is required.'; isValid = false; }
        if (!formData.location.trim()) { newErrors.location = 'Location is required.'; isValid = false; }
        if (!formData.description.trim()) { newErrors.description = 'Job description is required.'; isValid = false; }
        if (formData.techStack.length === 0) { newErrors.techStack = 'Add at least one tech stack tag.'; isValid = false; }
        if (formData.salaryMin && formData.salaryMax && formData.salaryMin > formData.salaryMax) {
             newErrors.salaryMax = 'Max salary must be greater than or equal to min salary.'; isValid = false;
        }
        if (formData.salaryMin && formData.salaryMin < 0) {
             newErrors.salaryMin = 'Salary cannot be negative.'; isValid = false;
        }
         if (formData.salaryMax && formData.salaryMax < 0) {
             newErrors.salaryMax = 'Salary cannot be negative.'; isValid = false;
        }

        setErrors(newErrors);
        return isValid;
   };


  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    if (!validateForm()) {
        toast.error("Please fix the errors in the form.");
        return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors from API or general errors
        if (response.status === 400 && result.details) {
            toast.error(`Validation Failed: ${result.details.join(', ')}`);
             // Optionally map API validation errors back to form fields if needed
             // setErrors(mapApiErrorsToForm(result.details));
             setErrors(prev => ({ ...prev, form: `API Error: ${result.error || result.details.join(', ')}` }));
        } else {
             throw new Error(result.error || `Failed to post job (status: ${response.status})`);
        }
      } else {
        toast.success('Job posted successfully!');
        setFormData(initialFormData); // Reset form
        setTechStackInput('');
         // Maybe fetch HR profile again if company might have changed (edge case)
         fetchHRProfile();
        // Optional: Redirect to a "My Jobs" page or the new job's page
        // router.push('/hr/my-jobs');
      }
    } catch (err: any) {
      console.error("Error posting job:", err);
      toast.error(`Failed to post job: ${err.message}`);
      setErrors(prev => ({ ...prev, form: `Submission Error: ${err.message}` }))
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- Render Loading/Auth State ---
  if (status === "loading" || isFetchingProfile) {
    return <div className="p-6 text-center text-gray-400">Loading...</div>;
  }
   if (status !== "authenticated" || user?.role !== 'hr') {
     // Should be redirected, but show message as fallback
     return <div className="p-6 text-center text-red-500">Access Denied. Please sign in as an HR user.</div>;
   }

  // --- Render Form ---
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="bg-gray-900 text-gray-100 rounded-lg shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6 text-indigo-400 border-b border-gray-700 pb-3">
          Post a New Job Opening
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Job Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="Job Title *"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Senior Frontend Developer"
              maxLength={150}
              required
              disabled={isSubmitting}
              error={errors.title}
            />
            <InputField
              label="Company Name *"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Your company's name"
              maxLength={100}
              required
              disabled={isSubmitting || isFetchingProfile} // Disable while fetching profile too
              error={errors.company}
            />
          </div>

          <InputField
            label="Location *"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g., Remote, New York, NY, London, UK"
            maxLength={100}
            required
            disabled={isSubmitting}
            error={errors.location}
          />

          {/* Job Details */}
          <TextAreaField
            label="Job Description (JD) *"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Provide a detailed description of the role, responsibilities, and qualifications..."
            required
            disabled={isSubmitting}
            error={errors.description}
          />

          {/* Tech Stack */}
          <div>
            <label htmlFor="techStackInput" className="block text-sm font-medium text-gray-300 mb-1">
              Tech Stack / Skills * <span className='text-xs text-gray-400'>(Add tags like React, Node.js, Python, AWS)</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                id="techStackInput"
                value={techStackInput}
                onChange={handleTechStackInputChange}
                onKeyDown={handleAddTechTagKey}
                placeholder="Type a tag and press Enter or Add"
                className={`flex-grow px-3 py-2 bg-gray-800 border ${errors.techStackInput ? 'border-red-500' : 'border-gray-700'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleAddTechTagClick}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white transition text-sm font-medium shrink-0 disabled:opacity-60"
                disabled={isSubmitting || !techStackInput.trim()}
              >
                Add Tag
              </button>
            </div>
             {errors.techStackInput && <p className="mt-1 text-xs text-red-400">{errors.techStackInput}</p>}
             {errors.techStack && !errors.techStackInput && <p className="mt-1 text-xs text-red-400">{errors.techStack}</p>}

            {/* Display Added Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.techStack.map((tag) => (
                <span key={tag} className="flex items-center bg-gray-700 text-indigo-300 text-sm font-medium px-2.5 py-1 rounded-full">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTechTag(tag)}
                    className="ml-1.5 text-gray-400 hover:text-red-400 focus:outline-none"
                    aria-label={`Remove ${tag}`}
                    disabled={isSubmitting}
                  >
                    × {/* Multiplication sign as 'x' */}
                  </button>
                </span>
              ))}
            </div>

            {/* Predefined Tags (Optional but helpful) */}
            <div className="mt-3 pt-2 border-t border-gray-700/50">
                 <p className="text-xs text-gray-400 mb-2">Or add common tags:</p>
                 <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TECH_TAGS.map(tag => (
                        !formData.techStack.includes(tag) && ( // Only show if not already added
                            <button
                                type="button"
                                key={tag}
                                onClick={() => addTechTag(tag)}
                                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-200 transition"
                                disabled={isSubmitting}
                            >
                                + {tag}
                            </button>
                        )
                    ))}
                 </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-700">
             <SelectField
                label="Employment Type"
                id="employmentType"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                options={EMPLOYMENT_TYPES}
                disabled={isSubmitting}
                error={errors.employmentType}
             />
             <SelectField
                label="Experience Level"
                id="experienceLevel"
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleInputChange}
                options={EXPERIENCE_LEVELS}
                disabled={isSubmitting}
                error={errors.experienceLevel}
             />
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                  label="Salary Range - Minimum ($)"
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  value={formData.salaryMin ?? ''} // Use empty string for controlled input if undefined
                  onChange={handleInputChange}
                  placeholder="e.g., 80000"
                  min="0"
                  disabled={isSubmitting}
                  error={errors.salaryMin}
              />
               <InputField
                  label="Salary Range - Maximum ($)"
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  value={formData.salaryMax ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 120000"
                  min="0"
                  disabled={isSubmitting}
                  error={errors.salaryMax}
               />
           </div>

          {/* Submission */}
          {errors.form && (
             <p className="text-sm text-red-400 text-center bg-red-900/30 p-2 rounded border border-red-700">{errors.form}</p>
          )}
          <div className="flex justify-end pt-5">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
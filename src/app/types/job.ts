// types/job.ts (or lib/job-types.ts)

// Predefined Tech Stack Tags
// Use 'as const' for better type safety and autocompletion
export const PREDEFINED_TECH_TAGS = ["Frontend", "Backend", "AI/ML", "Cloud", "DevOps", "Mobile", "Data Science", "QA", "Security"] as const;
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"] as const;
export const EXPERIENCE_LEVELS = ["Entry-level", "Mid-level", "Senior-level", "Lead", "Manager"] as const;

// Helper types derived from the const arrays
export type PredefinedTechTag = typeof PREDEFINED_TECH_TAGS[number];
export type EmploymentType = typeof EMPLOYMENT_TYPES[number];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

// Interface for data sent from the client to create a job
export interface JobPostClientData {
    title: string;
    company: string;
    location: string;
    description: string;
    techStack: string[];
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: EmploymentType | ''; // Allow empty string for form state
    experienceLevel?: ExperienceLevel | ''; // Allow empty string for form state
}
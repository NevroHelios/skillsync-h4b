export type ValidationStatus = 'pending' | 'validating' | 'needs_review' | 'verified' | 'failed';

export type Certificate = {
  title: string;
  issuer: string;
  year: string;
  fileUrl?: string;
  verified?: boolean; // Consider if this is still needed alongside validationStatus
  status?: "pending" | "verified"; // Consider if this is still needed alongside validationStatus
  validationStatus?: ValidationStatus;
  aiSuggestedIssuer?: string;
};

export type Experience = {
  company: string;
  years: string;
  skills: string[]; // Skills associated with the experience
};

export interface Project {
  private _id(_id: any): void;
  name: string;
  description?: string;
  link?: string;
  skills?: string[]; // Add optional skills array
  experience?: string; // Add optional experience link (e.g., "Company (Year)")
  githubRepoName?: string; // Optional: Name of the linked GitHub repo
};

export type CPProfile = { 
  platform: string; 
  handle: string; 
  link: string; 
};

export type Skill = string;
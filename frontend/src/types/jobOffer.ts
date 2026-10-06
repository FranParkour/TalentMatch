export type JobOfferStatus = 'active' | 'inactive';

export interface JobOffer {
  id: number;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  experience_required: string;
  status: JobOfferStatus;
  required_skills: string[];
  preferred_skills: string[];
  requirements: string[];
  created_at: string;
  updated_at: string;
  cvs_count?: number;
  evaluated_count?: number;
}

export interface JobOfferFormData {
  title: string;
  description: string;
  location: string;
  employment_type: string;
  experience_required: string;
  status: JobOfferStatus;
  required_skills: string[];
  preferred_skills: string[];
  requirements: string[];
}

export interface ApiDeleteResponse {
  message: string;
  id: number;
  success: boolean;
}

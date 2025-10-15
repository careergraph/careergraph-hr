import { SkillLookup } from "./skill";

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  postedDate: string;
  status?: "draft" | "active" | "closed";
  
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  minimumQualifications?: string[];
  skills?: SkillLookup[];
  salaryRange?: string;
  contactEmail?: string;
  contactPhone?: string;
  timeline?: JobTimelineEvent[];
  
  // Experience
  minExperience?: number;
  maxExperience?: number;
  experienceLevel?: string;
  
  // Listing details
  jobFunction?: string;
  employmentType?: string;
  education?: string;
  
  // Location details
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  remoteJob?: boolean;
  
  // Application requirements
  applicationRequirements?: ApplicationRequirements;
  
  // Promotion
  promotionType?: "free" | "paid";
  
  // Stats
  views?: number;
  applicants?: number;
  saved?: number;
  likes?: number;
  shares?: number;
}

interface JobTimelineEvent {
  date: string;
  action: string;
  description?: string;
  user?: string;
}

interface ApplicationRequirements {
  resume: boolean;
  coverLetter: boolean;
  photo: boolean;
  desiredSalary: boolean;
  screeningQuestions?: ScreeningQuestion[];
}

interface ScreeningQuestion {
  id: string;
  question: string;
  type: "text" | "multiple-choice" | "yes-no";
  required: boolean;
  options?: string[];
}

type Touched = {
  title?: boolean;
  description?: boolean;
  minExperience?: boolean;
  maxExperience?: boolean;
  experienceLevel?: boolean;
  jobFunction?: boolean;
  type?: boolean;
  country?: boolean;
};

type ErrorType = {
  title?: string;
  description?: string;
  minExperience?: string;
  maxExperience?: string;
  experienceLevel?: string;
  jobFunction?: string;
  type?: string;
  country?: string;
};

export type { Job, JobTimelineEvent, ApplicationRequirements, ScreeningQuestion, Touched, ErrorType };
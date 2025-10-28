import {
  Education,
  EmploymentType,
  ExperienceLevel,
  JobCategory
} from "@/enums/workEnum";
import { SkillLookup } from "./skill";
import { Status } from "@/enums/commonEnum";

type Job = {
  id: string;
  postedDate: Date;
  status?: Status;
  title: string;
  description?: string;

  // Array requirment
  responsibilities?: string[];
  qualifications?: string[];
  minimumQualifications?: string[];

  // Experience
  minExperience?: number;
  maxExperience?: number;
  experienceLevel?: ExperienceLevel;

  // Listing details
  employmentType?: EmploymentType;
  education?: Education;
  jobCategory?: JobCategory;

  // Location details
  state?: string;
  city?: string;
  district?: string;
  specific?: string;
  remoteJob?: boolean;

  // Field basic
  type?: EmploymentType;
  department?: string;
  benefits?: string[];
  numberOfPositions?: number;

  // Stats: Show phân tích data
  views?: number;
  applicants?: number;
  saved?: number;
  likes?: number;
  shares?: number;

  // Lookup skill
  skills?: SkillLookup[];

  salaryRange?: string;
  contactEmail?: string;
  contactPhone?: string;
  expiryDate?: string;
  timeline?: JobTimelineEvent[];

  // Application requirements
  applicationRequirements?: ApplicationRequirements;

  // Promotion
  promotionType?: "free" | "paid";
};

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

// Type tương tác giao diện
type Touched = {
  title?: boolean;
  description?: boolean;
  minExperience?: boolean;
  maxExperience?: boolean;
  experienceLevel?: boolean;
  jobCategory?: boolean;
  type?: boolean;
  country?: boolean;
};

type ErrorType = {
  title?: string;
  description?: string;
  minExperience?: string;
  maxExperience?: string;
  experienceLevel?: string;
  employmentType?: string;
  jobCategory?: string;
  type?: string;
  location?: string;
};

export type {
  Job,
  JobTimelineEvent,
  ApplicationRequirements,
  ScreeningQuestion,
  Touched,
  ErrorType,
};

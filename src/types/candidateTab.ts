// API response types for candidate endpoints

export interface CandidateOverviewResponse {
  id: string;
  profileSummary?: string;
  skills?: string[];
  certifications?: string[];
  education?: {
    school?: string;
    degree?: string;
    major?: string;
    year?: string;
  };
  links?: { label: string; url: string }[];
  social?: { linkedin?: string; github?: string };
  preferredLocations?: string[];
  expectedSalary?: string;
  noticePeriod?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  actor?: string;
}

export interface CandidateExperienceResponse {
  id: string;
  timeline?: TimelineEvent[];
  summary?: string;
  totalYears?: number;
  previousRoles?: Array<{ company: string; title: string; from: string; to?: string }>;
}

export interface CandidateResumeResponse {
  id: string;
  resumeUrl?: string;
  parsed?: {
    summary?: string;
    skills?: string[];
    experiences?: Array<{ company: string; title: string; from: string; to?: string; summary?: string }>;
    education?: Array<{ school: string; degree?: string; year?: string }>;
  };
}

export interface MessageItem {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  createdAt: string;
  sender?: string;
}

export interface CandidateMessagesResponse {
  id: string;
  messages?: MessageItem[];
}

export interface EmailThread {
  id: string;
  subject: string;
  snippet?: string;
  lastUpdated: string;
  participants?: string[];
}

export interface CandidateEmailsResponse {
  id: string;
  threads?: EmailThread[];
}

export default {};

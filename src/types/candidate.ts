// Type definitions for HR Recruitment Kanban board

export type Priority = "low" | "medium" | "high";
export type Status = "apply" | "meeting" | "interview" | "trial" | "hired";
export type ExperienceLevel = "intern" | "junior" | "mid" | "senior" | "lead";

export interface Assignee {
  id?: string;
  name?: string;
}

export interface TimelineEvent {
  id: string;
  action: string;
  description: string;
  date: string;
  user: string;
}

export interface Candidate {
  candidateId: string;
  id: string;
  ticketId: string;
  jobId: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  priority: Priority;
  status: Status;
  appliedDate: string;
  experienceLevel: ExperienceLevel;
  salaryExpectation?: string;
  assignee?: Assignee;
  labels: string[];
  description?: string;
  timeline: TimelineEvent[];

  avatar?: string;
  age: number;
  experience: string;
  lastActive: string;

  // Personal details
  gender: "Nam" | "Nữ";
  birthYear: number;
  maritalStatus: string;
  location: {
    city: string;
    province: string;
  };
  address?: string;

  // Education
  education: string;
  yearsOfExperience: string;
  currentLevel: string;
  desiredLevel: string;

  // Work preferences
  desiredSalary: string;
  workLocation: string;
  workType: string;
  industry: string;

  // Additional info
  skills?: string[];
  languages?: string[];

  // Status
  hasPurchased?: boolean;

  educationLevel?: string;
}

export interface Column {
  id: Status;
  title: string;
  candidates: Candidate[];
}

export interface SuggestionCandidate {
  id: string;
  name: string;
  age: number;
  avatar: string;
  position: string;
  experience: string;
  lastActive: string;
  phone: string;
  email: string;
  gender: string;
  birthYear: number;
  maritalStatus: string;
  location: { city: string; province: string };
  address: string;
  education: string;
  yearsOfExperience: string;
  currentLevel: string;
  desiredLevel: string;
  desiredSalary: string;
  workLocation: string;
  workType: string;
  industry: string;
  skills: Array<string>;
  hasPurchased: false;
  ticketId: string;
  priority: string;
  status: string;
  appliedDate: string;
  source: string;
  resumeUrl: string;
  notes: string;
}

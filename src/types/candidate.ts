// Type definitions for HR Recruitment Kanban board

export type Priority = "low" | "medium" | "high";
export type Status = "apply" | "meeting" | "interview" | "trial" | "hired";
export type ExperienceLevel = "intern" | "junior" | "mid" | "senior" | "lead";

export interface Assignee {
  id: string;
  name: string;
}

export interface TimelineEvent {
  id: string;
  action: string;
  description: string;
  date: string;
  user: string;
}

export interface Candidate {
  id: string;
  ticketId: string;
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
}

export interface Column {
  id: Status;
  title: string;
  candidates: Candidate[];
}

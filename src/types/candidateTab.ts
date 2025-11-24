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



export interface ContactResponse {
  contactType: string;       // "PHONE" | "EMAIL" | ...
  value: string;
  isPrimary?: boolean;
}

export interface AddressResponse {
  province?: string;
  district?: string;
  ward?: string;
  isPrimary?: boolean;
  addressType: string;
  country: string;
}

export interface CandidateProfileResponse {
  candidateId: string;

  firstName: string;
  lastName: string;
  email: string;
  gender: "MALE" | "FEMALE" | string;
  dateOfBirth: string;         // "YYYY-MM-DD"
  isMarried: boolean;

  contacts: ContactResponse[];
  addresses: AddressResponse[];
}
export interface CandidateJobCriteriaResponse {
    desiredPosition: string,
    industries: string [];
    locations: string [];       // "MALE" | "FEMALE" | ...
    salaryExpectationMin: number;
    salaryExpectationMax: number;
    workTypes: string []
}
export interface CandidateSkillResponse {
    proficiencyLevel: string;
    yearsOfExperience: number,
    isVerified: boolean,
    endorsedBy : string;
    endorsementDate:number;
    endorsementCount: number;
    candidateId : string;
    skillId : string;
    skillName : string;
}
export interface CandidateEducationResponse {
    id: string;
    startDate: string;
    endDate: string;
    degreeTitle: string;
    isCurrent: boolean;
    description: string;
    universityId: string;
    officialName: string;
    major: string;
}
export interface CExperienceResponse {
    id: string;
    startDate: string;
    endDate: string;
    salary: number;
    jobTitle: string;
    isCurrent: boolean;
    description: string;
    candidateId: string;
    companyId: string;
    companyName: string;
}
export interface CandidateOverview {
  profile: CandidateProfileResponse;
  jobCriteria: CandidateJobCriteriaResponse;
  skills: CandidateSkillResponse [];
  educations: CandidateEducationResponse[];
}

export interface OverviewExperience {
  experiences: CExperienceResponse[];
  totalYear: number;
  summary: string ;
}

export default {};

export type InterviewStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "PENDING_RESCHEDULE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface InterviewTimeProposal {
  id: string;
  interviewId: string;
  proposedDate: string;
  proposedStartTime: string;
  proposedDurationMinutes: number;
  notes?: string;
  proposalStatus: ProposalStatus;
  createdDate: string;
}

export type InterviewType = "ONLINE" | "OFFLINE";

export type FeedbackRecommendation =
  | "NEXT_ROUND"
  | "EXTEND_OFFER"
  | "REJECT"
  | "HOLD";

export interface InterviewParticipant {
  id: string;
  accountId: string;
  name: string;
  role: "INTERVIEWER" | "CANDIDATE" | "OBSERVER";
  joinedAt?: string;
  leftAt?: string;
}

export interface InterviewFeedback {
  id: string;
  interviewId: string;
  reviewerId: string;
  reviewerName: string;
  overallRating: number;
  technicalScore?: number;
  communicationScore?: number;
  cultureFitScore?: number;
  problemSolvingScore?: number;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
  recommendation: FeedbackRecommendation;
  createdDate: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName?: string;
  scheduledAt: string;
  endAt: string;
  durationMinutes: number;
  type: InterviewType;
  interviewStatus: InterviewStatus;
  meetingLink?: string;
  location?: string;
  notes?: string;
  rescheduledFromId?: string;
  cancellationReason?: string;
  interviewers: InterviewParticipant[];
  feedback?: InterviewFeedback[];
  timeProposals?: InterviewTimeProposal[];
  createdDate: string;
  lastModifiedDate?: string;
}

export interface CreateInterviewRequest {
  applicationId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  type: InterviewType;
  location?: string;
  interviewerIds?: string[];
  notes?: string;
  notifyCandidate?: boolean;
}

export interface RescheduleInterviewRequest {
  newDate: string;
  newStartTime: string;
  durationMinutes: number;
  interviewerIds?: string[];
  notes?: string;
}

export interface InterviewFeedbackRequest {
  overallRating: number;
  technicalScore?: number;
  communicationScore?: number;
  cultureFitScore?: number;
  problemSolvingScore?: number;
  strengths?: string;
  weaknesses?: string;
  recommendation: string;
  notes?: string;
}

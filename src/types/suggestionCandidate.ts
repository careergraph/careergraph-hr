/**
 * Types for Candidate Suggestion feature
 * Used by HR/Company to search and view suitable candidates
 */

export interface CandidateSuggestionResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  gender?: string;

  // Job criteria
  desiredPosition?: string;
  currentJobTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  experienceLevel?: string;
  educationLevel?: string;

  // Work preferences
  industries?: string[];
  locations?: string[];
  workTypes?: string[];
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;

  // Skills
  skills?: string[];

  // Summary
  summary?: string;

  // Status
  isOpenToWork?: boolean;
  lastActive?: string;

  // Search relevance score
  score?: number;
}

export interface CandidateFilterRequest {
  keyword?: string;
  educationLevels?: string[];
  experienceLevels?: string[];
  industries?: string[];
  locations?: string[];
  workTypes?: string[];
  minYearsOfExperience?: number;
  maxYearsOfExperience?: number;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface SuggestionCandidateListItem {
  id: string;
  name: string;
  avatar?: string;
  position: string;
  experience: string;
  lastActive: string;
  phone?: string;
  email: string;
  skills: string[];
  location: string;
  salary: string;
  isOpenToWork: boolean;
  score?: number;
}

/**
 * Education response from BE
 */
export interface CandidateEducationResponse {
  id: string;
  startDate?: string;
  endDate?: string;
  degreeTitle?: string;
  isCurrent?: boolean;
  description?: string;
  universityId?: string;
  officialName?: string;
  major?: string;
}

/**
 * Experience response from BE
 */
export interface CandidateExperienceResponse {
  id: string;
  startDate?: string;
  endDate?: string;
  salary?: number;
  jobTitle?: string;
  isCurrent?: boolean;
  description?: string;
  candidateId?: string;
  companyId?: string;
  companyName?: string;
}

/**
 * Overview response (educations)
 */
export interface CandidateOverviewResponse {
  profile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    isMarried?: boolean;
  };
  jobCriteria?: {
    desiredPosition?: string;
    industries?: string[];
    workTypes?: string[];
    locations?: string[];
    salaryExpectationMin?: number;
    salaryExpectationMax?: number;
  };
  skills?: { id: string; name: string }[];
  educations?: CandidateEducationResponse[];
}

/**
 * Experience overview response
 */
export interface CandidateExperienceOverviewResponse {
  experiences?: CandidateExperienceResponse[];
  totalYear?: number;
  summary?: string;
}

/**
 * Map API response to UI list item
 */
export const mapToListItem = (
  candidate: CandidateSuggestionResponse
): SuggestionCandidateListItem => {
  const fullName =
    [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") ||
    "Unknown";

  const experience = candidate.yearsOfExperience
    ? `${candidate.yearsOfExperience} năm kinh nghiệm`
    : "Chưa có kinh nghiệm";

  const location =
    candidate.locations && candidate.locations.length > 0
      ? candidate.locations.join(", ")
      : "Chưa cập nhật";

  const salary =
    candidate.salaryExpectationMin || candidate.salaryExpectationMax
      ? formatSalaryRange(
          candidate.salaryExpectationMin,
          candidate.salaryExpectationMax
        )
      : "Thỏa thuận";

  return {
    id: candidate.id,
    name: fullName,
    avatar: candidate.avatar,
    position: candidate.desiredPosition || candidate.currentJobTitle || "Chưa cập nhật",
    experience,
    lastActive: candidate.lastActive
      ? formatLastActive(candidate.lastActive)
      : "Không rõ",
    phone: candidate.phone,
    email: candidate.email,
    skills: candidate.skills || [],
    location,
    salary,
    isOpenToWork: candidate.isOpenToWork ?? false,
    score: candidate.score,
  };
};

/**
 * Format salary range for display
 */
const formatSalaryRange = (min?: number, max?: number): string => {
  if (!min && !max) return "Thỏa thuận";

  const formatMoney = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)} triệu`;
    }
    return value.toLocaleString("vi-VN");
  };

  if (min && max) {
    return `${formatMoney(min)} - ${formatMoney(max)}`;
  }
  if (min) {
    return `Từ ${formatMoney(min)}`;
  }
  if (max) {
    return `Đến ${formatMoney(max)}`;
  }
  return "Thỏa thuận";
};

/**
 * Format last active date
 */
const formatLastActive = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d); // local midnight
    const now = new Date();

    // Reset giờ để so sánh theo NGÀY
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  } catch {
    return "Không rõ";
  }
};

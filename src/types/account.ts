export interface CompanyAddress {
  name?: string;
  label?: string;
  street?: string;
  district?: string;
  city?: string;
  country?: string;
  province?: string;
  ward?: string;
  isPrimary?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CompanyContact {
  type?: string;
  value?: string;
  label?: string;
  isPrimary?: boolean;
}

export interface CompanyProfile {
  id?: string;
  name?: string;
  tagName?: string | null;
  avatar?: string | null;
  cover?: string | null;
  size?: string | null;
  website?: string | null;
  ceoName?: string | null;
  description?: string | null;
  noOfMembers?: number | null;
  foundedYear?: string | number | null;
  followers?: number;
  following?: number;
  connections?: number;
  role?: string;
  email?: string;
  offerBeforeTrial?: boolean;
  enableOffboardedStage?: boolean;
  addresses?: CompanyAddress[];
  contacts?: CompanyContact[];
  verificationStatus?: string;
  operationalStatus?: string;
  taxCode?: string | null;
  legalRepresentativeName?: string | null;
  verificationAdminNote?: string | null;
  blockedReason?: string | null;
}

export interface AccountProfile {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  jobTitle?: string;
  companyId?: string;
  status?: string;
  locale?: string;
  metadata?: Record<string, unknown> | null;
  company?: CompanyProfile | null;
}

export type AuthUser = AccountProfile;

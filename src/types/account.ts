export interface CompanyAddress {
  label?: string;
  street?: string;
  district?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface CompanyContact {
  type?: string;
  value?: string;
  label?: string;
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
  foundedYear?: string | number | null;
  followers?: number;
  following?: number;
  connections?: number;
  addresses?: CompanyAddress[];
  contacts?: CompanyContact[];
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

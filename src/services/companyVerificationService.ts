import api from "@/config/axiosConfig";

export interface VerificationDocument {
  id?: string;
  documentUrl: string;
  documentType?: string;
  originalFileName?: string;
  mimeType?: string;
}

export interface CompanyVerificationRequest {
  requestId?: string;
  id?: string; // Legacy - for backward compatibility
  companyId?: string;
  verificationStatus?: string;
  status?: string; // Legacy - for backward compatibility
  taxCode?: string;
  companyName?: string;
  legalRepresentativeName?: string;
  businessEmail?: string;
  website?: string;
  documents?: VerificationDocument[];
  submittedAt?: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface CompanyVerificationResponse {
  verificationStatus?: string;
  operationalStatus?: string;
  latestRequest?: CompanyVerificationRequest;
  adminNote?: string;
}

type ApiEnvelope<T> = { data?: T } | { result?: T } | T;

const unwrap = <T>(payload: ApiEnvelope<T>): T => {
  if (payload && typeof payload === "object") {
    if ("data" in payload && payload.data !== undefined) {
      return payload.data as T;
    }
    if ("result" in payload && payload.result !== undefined) {
      return payload.result as T;
    }
  }
  return payload as T;
};

const companyVerificationService = {
  getVerificationStatus: async (): Promise<CompanyVerificationResponse | null> => {
    const response = await api.get("/companies/me/verification");
    const payload = unwrap(response.data);

    if (!payload || typeof payload !== "object") {
      return null;
    }

    const data = unwrap(payload as ApiEnvelope<Record<string, unknown>>);

    if (!data || typeof data !== "object") {
      return null;
    }

    return data as CompanyVerificationResponse;
  },

  uploadDocument: async (file: File, companyId: string): Promise<VerificationDocument | null> => {
    const isImage = file.type.startsWith("image/");
    const formData = new FormData();
    formData.append("file", file);

    try {
      if (isImage) {
        // Keep image URLs as image CDN assets so admin can preview them inline.
        const response = await api.post(
          `/media/image?ownerType=company&idd=${encodeURIComponent(companyId)}&fileType=DOCUMENT`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const payload = unwrap(response.data) as { url?: string; originalFileName?: string; mimeType?: string } | null;
        if (!payload?.url) return null;

        return {
          documentUrl: payload.url,
          originalFileName: payload.originalFileName ?? file.name,
          mimeType: payload.mimeType ?? file.type,
        } as VerificationDocument;
      } else {
        // Upload PDFs via /media/file endpoint
        const response = await api.post(
          `/media/file?ownerType=company&idd=${encodeURIComponent(companyId)}&fileType=DOCUMENT`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const payload = unwrap(response.data) as { url?: string; originalFileName?: string; mimeType?: string } | null;

        if (!payload || !payload.url) {
          return null;
        }

        return {
          documentUrl: payload.url,
          originalFileName: payload.originalFileName ?? file.name,
          mimeType: payload.mimeType ?? file.type,
        } as VerificationDocument;
      }
    } catch (error) {
      console.error("Document upload failed:", error);
      return null;
    }
  },

  submitVerification: async (payload: Partial<CompanyVerificationRequest>): Promise<CompanyVerificationRequest | null> => {
    const response = await api.post("/companies/me/verification", payload);
    const wrapped = unwrap(response.data);

    if (!wrapped || typeof wrapped !== "object") {
      return null;
    }

    const data = unwrap(wrapped as ApiEnvelope<Record<string, unknown>>);

    if (!data || typeof data !== "object") {
      return null;
    }

    return data as CompanyVerificationRequest;
  },

  updateVerification: async (requestId: string, payload: Partial<CompanyVerificationRequest>): Promise<CompanyVerificationRequest | null> => {
    const response = await api.put(`/companies/me/verification/${requestId}`, payload);
    const wrapped = unwrap(response.data);

    if (!wrapped || typeof wrapped !== "object") {
      return null;
    }

    const data = unwrap(wrapped as ApiEnvelope<Record<string, unknown>>);

    if (!data || typeof data !== "object") {
      return null;
    }

    return data as CompanyVerificationRequest;
  },

  listMyRequests: async (): Promise<CompanyVerificationRequest[]> => {
    const response = await api.get("/companies/me/verification-requests");
    const wrapped = unwrap(response.data);

    if (!wrapped || !Array.isArray(wrapped)) {
      return [];
    }

    return wrapped as CompanyVerificationRequest[];
  },
};

export default companyVerificationService;

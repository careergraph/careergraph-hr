import api from "@/config/axiosConfig";
import type { CompanyProfile, CompanyAddress, CompanyContact } from "@/types/account";

// companyService xử lý việc ánh xạ và lấy dữ liệu hồ sơ doanh nghiệp.

type ApiEnvelope<T> = { data?: T } | { result?: T } | T;

const unwrap = <T>(payload: ApiEnvelope<T>): T => {
  // Chuẩn hóa nhiều định dạng response khác nhau về cùng shape.
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

const mapAddress = (raw: Record<string, unknown>): CompanyAddress => ({
  // Chỉ chấp nhận chuỗi/number hợp lệ, tránh undefined gây crash UI.
  name: typeof raw.name === "string" ? raw.name : undefined,
  label: typeof raw.label === "string" ? raw.label : undefined,
  street:
    typeof raw.street === "string"
      ? raw.street
      : typeof raw.ward === "string"
      ? raw.ward
      : typeof raw.name === "string"
      ? raw.name
      : undefined,
  district: typeof raw.district === "string" ? raw.district : undefined,
  province: typeof raw.province === "string" ? raw.province : undefined,
  ward:
    typeof raw.ward === "string"
      ? raw.ward
      : typeof raw.street === "string"
      ? raw.street
      : typeof raw.name === "string"
      ? raw.name
      : undefined,
  city:
    typeof raw.city === "string"
      ? raw.city
      : typeof raw.province === "string"
      ? raw.province
      : undefined,
  country: typeof raw.country === "string" ? raw.country : undefined,
  isPrimary: typeof raw.isPrimary === "boolean" ? raw.isPrimary : undefined,
  latitude: typeof raw.latitude === "number" ? raw.latitude : undefined,
  longitude: typeof raw.longitude === "number" ? raw.longitude : undefined,
});

const mapContact = (raw: Record<string, unknown>): CompanyContact => ({
  type:
    typeof raw.type === "string"
      ? raw.type
      : typeof raw.contactType === "string"
      ? raw.contactType
      : undefined,
  value: typeof raw.value === "string" ? raw.value : undefined,
  label: typeof raw.label === "string" ? raw.label : undefined,
  isPrimary: typeof raw.isPrimary === "boolean" ? raw.isPrimary : undefined,
});

const mapCompany = (raw: Record<string, unknown>): CompanyProfile => {
  // Ánh xạ dữ liệu thô từ API sang model nội bộ.
  const addresses = Array.isArray(raw.addresses)
    ? (raw.addresses as Record<string, unknown>[]).map(mapAddress)
    : undefined;

  const contacts = Array.isArray(raw.contacts)
    ? (raw.contacts as Record<string, unknown>[]).map(mapContact)
    : undefined;

  return {
    id: typeof raw.companyId === "string" ? raw.companyId : (raw.id as string | undefined),
    name: typeof raw.name === "string" ? raw.name : undefined,
    tagName: typeof raw.tagname === "string" ? raw.tagname : undefined,
    avatar: typeof raw.avatar === "string" ? raw.avatar : undefined,
    cover: typeof raw.cover === "string" ? raw.cover : undefined,
    size: typeof raw.size === "string" ? raw.size : undefined,
    website: typeof raw.website === "string" ? raw.website : undefined,
    ceoName: typeof raw.ceoName === "string" ? raw.ceoName : undefined,
    description: typeof raw.description === "string" ? raw.description : undefined,
    noOfMembers: typeof raw.noOfMembers === "number" ? raw.noOfMembers : undefined,
    foundedYear:
      typeof raw.yearFounded === "number" || typeof raw.yearFounded === "string"
        ? raw.yearFounded
        : undefined,
    followers: typeof raw.noOfFollowers === "number" ? raw.noOfFollowers : undefined,
    following: typeof raw.noOfFollowing === "number" ? raw.noOfFollowing : undefined,
    connections: typeof raw.noOfConnections === "number" ? raw.noOfConnections : undefined,
    role: typeof raw.role === "string" ? raw.role : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    offerBeforeTrial:
      typeof raw.offerBeforeTrial === "boolean"
        ? raw.offerBeforeTrial
        : undefined,
    enableOffboardedStage:
      typeof raw.enableOffboardedStage === "boolean"
        ? raw.enableOffboardedStage
        : undefined,
    addresses,
    contacts,
  };
};

const companyService = {
  getMyCompany: async (): Promise<CompanyProfile | null> => {
    const response = await api.get("/companies/me");
    const payload = unwrap(response.data);

    if (!payload || typeof payload !== "object") {
      return null;
    }

    const data = unwrap(payload as ApiEnvelope<Record<string, unknown>>);

    if (!data || typeof data !== "object") {
      return null;
    }

    // Trả về profile đã được chuẩn hóa; null nếu thiếu dữ liệu.
    return mapCompany(data as Record<string, unknown>);
  },

  updateMyCompanyProfile: async (payload: Record<string, unknown>): Promise<CompanyProfile | null> => {
    const response = await api.put("/companies/me/profile", payload);
    const wrapped = unwrap(response.data);
    if (!wrapped || typeof wrapped !== "object") {
      return null;
    }

    const data = unwrap(wrapped as ApiEnvelope<Record<string, unknown>>);
    if (!data || typeof data !== "object") {
      return null;
    }

    return mapCompany(data as Record<string, unknown>);
  },

  uploadCompanyImage: async (companyId: string, file: File, fileType: "AVATAR" | "COVER") => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/media/image?ownerType=company&idd=${encodeURIComponent(companyId)}&fileType=${encodeURIComponent(fileType)}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const payload = unwrap(response.data) as { url?: string } | null;
    return payload?.url ?? null;
  },
};

export default companyService;

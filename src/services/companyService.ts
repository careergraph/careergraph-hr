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
  label: typeof raw.label === "string" ? raw.label : undefined,
  street: typeof raw.street === "string" ? raw.street : undefined,
  district: typeof raw.district === "string" ? raw.district : undefined,
  city: typeof raw.city === "string" ? raw.city : undefined,
  country: typeof raw.country === "string" ? raw.country : undefined,
  latitude: typeof raw.latitude === "number" ? raw.latitude : undefined,
  longitude: typeof raw.longitude === "number" ? raw.longitude : undefined,
});

const mapContact = (raw: Record<string, unknown>): CompanyContact => ({
  type: typeof raw.type === "string" ? raw.type : undefined,
  value: typeof raw.value === "string" ? raw.value : undefined,
  label: typeof raw.label === "string" ? raw.label : undefined,
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
    foundedYear:
      typeof raw.yearFounded === "number" || typeof raw.yearFounded === "string"
        ? raw.yearFounded
        : undefined,
    followers: typeof raw.noOfFollowers === "number" ? raw.noOfFollowers : undefined,
    following: typeof raw.noOfFollowing === "number" ? raw.noOfFollowing : undefined,
    connections: typeof raw.noOfConnections === "number" ? raw.noOfConnections : undefined,
    addresses,
    contacts,
  };
};

const companyService = {
  getMyCompany: async (): Promise<CompanyProfile | null> => {
    const response = await api.get("/company/me");
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
};

export default companyService;

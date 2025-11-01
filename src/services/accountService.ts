import api from "@/config/axiosConfig";
import type { AccountProfile, CompanyProfile } from "@/types/account";

// accountService truy xuất thông tin tài khoản đang đăng nhập.

type ApiResponse<T> = { data: T } | T;

const unwrapResponse = <T>(value: ApiResponse<T>): T => {
  // Một số API bọc kết quả trong thuộc tính data.
  if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
    return (value as { data: T }).data;
  }

  return value as T;
};

export interface CurrentAccountResponse {
  account?: AccountProfile;
  company?: CompanyProfile;
  [key: string]: unknown;
}

const accountService = {
  getCurrentAccount: async (): Promise<AccountProfile | null> => {
    const response = await api.get<ApiResponse<CurrentAccountResponse | AccountProfile>>("/auth/current");
    const payload = unwrapResponse(response.data);

    if (payload && typeof payload === "object") {
      if ("account" in payload && typeof payload.account === "object") {
        const account = payload.account as AccountProfile;
        // Một số response trả company tách riêng, ghép vào account để tiện sử dụng.
        if (!account.company && "company" in payload && typeof payload.company === "object") {
          account.company = payload.company as CompanyProfile;
          if (!account.companyId && account.company?.id) {
            account.companyId = account.company.id;
          }
        }
        // Trả về profile account đã ghép thông tin công ty nếu có.
        return account;
      }

      // Backend cũng có thể trả thẳng đối tượng account không bọc account: {...}.
      return payload as AccountProfile;
    }

    return null;
  },
};

export default accountService;

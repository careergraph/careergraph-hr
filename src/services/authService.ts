import api from "@/config/axiosConfig";
import type { AccountProfile, CompanyProfile } from "@/types/account";

// authService đóng gói các cuộc gọi liên quan đến xác thực.

export interface RegisterHrPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ConfirmOtpPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  account?: AccountProfile;
  company?: CompanyProfile;
  [key: string]: unknown;
}

const authService = {
  registerHr: async (payload: RegisterHrPayload) => {
    // Đăng ký tài khoản HR mới.
    const response = await api.post("/auth/register/hr", payload);
    return response.data;
  },

  confirmOtp: async (payload: ConfirmOtpPayload) => {
    // Xác thực mã OTP sau khi đăng ký.
    const response = await api.post("/auth/confirm-otp", payload);
    // Endpoint trả về thông điệp thành công/ token tùy cấu hình backend.
    return response.data;
  },

  login: async (payload: LoginPayload) => {
    // Đăng nhập và nhận token truy cập.
    const response = await api.post("/auth/login", payload);
    return response.data as LoginResponse;
  },
};

export default authService;

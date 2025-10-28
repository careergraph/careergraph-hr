import api from "@/config/axiosConfig";
import type { AccountProfile, CompanyProfile } from "@/types/account";

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
    const response = await api.post("/auth/register/hr", payload);
    return response.data;
  },

  confirmOtp: async (payload: ConfirmOtpPayload) => {
    const response = await api.post("/auth/confirm-otp", payload);
    return response.data;
  },

  login: async (payload: LoginPayload) => {
    const response = await api.post("/auth/login", payload);
    return response.data as LoginResponse;
  },
};

export default authService;

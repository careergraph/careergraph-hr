import api from "@/config/axiosConfig";
import ForgotPassword from "@/pages/AuthPages/ForgotPassword";
import ResetPassword from "@/pages/AuthPages/ResetPassword";
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
  role: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  account?: AccountProfile;
  company?: CompanyProfile;
  [key: string]: unknown;
}
export interface ForgotPassword {
    email?: string;
}
export interface VerifyOtp {
  email?: string,
  otp?: number
}
export interface ResendOTP {
  email?: string
}

export interface ResetPassword {
  newPassword?: string
}

const authService = {
  registerHr: async (payload: RegisterHrPayload) => {
    // Đăng ký tài khoản HR mới.
    const response = await api.post("/auth/register/hr", payload);
    return response.data;
  },

  getTtlOtp: async(email: string) =>{
    const res = await api.get(`/auth/ttl-otp?email=${encodeURIComponent(email)}`)
    return res.data
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
  forgotPassword: async (payload: ForgotPassword) =>{
    const response = await api.post("/auth/forgot-password", payload)
    return response.data;
  },
  verifyOTPResetPassword: async(payload: VerifyOtp) =>{
    const response = await api.post("/auth/confirm-otp-reset-password", payload)
    return response.data;
  }, 
  verifyOTPRegister: async(payload: VerifyOtp) => {
    const response = await api.post("/auth/confirm-otp-register", payload)
    return response.data;
  },  
  resendOtp: async (payload: ResendOTP) => {
    const res = await api.post("/auth/resend-otp", payload);
    return res.data
  },
  resetPassword: async(payload: ResetPassword) => {
    const res = await api.put("/auth/reset-password", payload);
    return res.data;
  }
};

export default authService;

export type OtpContext = {
  email: string;
  purpose: "verify_email" | "reset_password";
  redirectTo: string;
};

const KEY = "OTP_CONTEXT_V1";

export const getOtpContext = (): OtpContext | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OtpContext;
  } catch {
    return null;
  }
};

export const saveOtpContext = (ctx: OtpContext) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    // 
  }
};

export const clearOtpContext = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 
  }
};

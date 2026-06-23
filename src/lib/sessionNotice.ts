export const SUPPORT_EMAIL = "support@careergraph.vn";

const SESSION_NOTICE_KEY = "careergraph-hr-session-notice";
const BLOCKED_CODE = "ACCOUNT_BLOCKED";

export type SessionNotice = {
  title: string;
  message: string;
  reason?: string | null;
  supportEmail?: string | null;
  type: "blocked" | "info";
};

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  status?: string;
  data?: {
    code?: string;
    reason?: string;
    supportEmail?: string;
    [key: string]: unknown;
  };
};

const normalizeWhitespace = (value?: string | null): string =>
  (value ?? "").replace(/\s+/g, " ").trim();

const normalizeMessage = (value?: string | null): string =>
  normalizeWhitespace(value).toLowerCase();

export const isBlockedMessage = (value?: string | null): boolean => {
  const normalized = normalizeMessage(value);
  return (
    normalized.includes("blocked") ||
    normalized.includes("suspended") ||
    normalized.includes("tạm khóa") ||
    normalized.includes("bị tạm khóa") ||
    normalized.includes("bi khoa") ||
    normalized.includes("bị khóa") ||
    normalized.includes("tam khoa")
  );
};

const buildBlockedAccountMessage = (supportEmail?: string | null): string => {
  const email = normalizeWhitespace(supportEmail) || SUPPORT_EMAIL;
  return `Tài khoản HR hoặc doanh nghiệp của bạn hiện đang bị tạm khóa. Vui lòng xem lý do bên dưới và liên hệ ${email} nếu cần giải trình hoặc hỗ trợ thêm.`;
};

const extractBlockedReason = (raw?: string | null): string | null => {
  const normalized = normalizeWhitespace(raw);
  if (!normalized) {
    return null;
  }

  const reasonMatch = normalized.match(/lý do:\s*(.+?)(?:\.\s*vui lòng liên hệ|$)/i);
  if (reasonMatch?.[1]) {
    return normalizeWhitespace(reasonMatch[1]);
  }

  if (isBlockedMessage(normalized)) {
    return null;
  }

  return normalized;
};

export const buildBlockedSessionNotice = (
  reason?: string | null,
  supportEmail?: string | null
): SessionNotice => ({
  title: "Tài khoản tạm khóa",
  message: buildBlockedAccountMessage(supportEmail),
  reason: normalizeWhitespace(reason) || null,
  supportEmail: normalizeWhitespace(supportEmail) || SUPPORT_EMAIL,
  type: "blocked",
});

export const buildBlockedSessionNoticeFromApiError = (
  payload?: ApiErrorPayload | null
): SessionNotice | null => {
  const data = payload?.data;
  if (data?.code === BLOCKED_CODE) {
    return buildBlockedSessionNotice(data.reason, data.supportEmail);
  }

  const message = payload?.message ?? payload?.error;
  if (isBlockedMessage(message)) {
    return buildBlockedSessionNotice(
      extractBlockedReason(message),
      data?.supportEmail
    );
  }

  return null;
};

export const resolveApiErrorCode = (payload?: ApiErrorPayload | null): string | null =>
  payload?.data?.code ?? payload?.status ?? payload?.error ?? null;

export const persistSessionNotice = (notice: SessionNotice): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SESSION_NOTICE_KEY, JSON.stringify(notice));
};

export const consumeSessionNotice = (): SessionNotice | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SESSION_NOTICE_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(SESSION_NOTICE_KEY);

  try {
    const parsed = JSON.parse(raw) as SessionNotice;
    if (!parsed?.title || !parsed?.message || !parsed?.type) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

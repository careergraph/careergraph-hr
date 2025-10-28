import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080/careergraph/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RequestConfigWithRetry = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const authExemptEndpoints = [
  "/auth/login",
  "/auth/register",
  "/auth/register/hr",
  "/auth/confirm-otp",
  "/auth/refresh-token",
];

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAccessTokenFromResponse = (data: unknown): string | null => {
  if (!data || typeof data !== "object") return null;

  if (
    "accessToken" in data &&
    typeof (data as Record<string, unknown>).accessToken === "string"
  ) {
    return (data as Record<string, unknown>).accessToken as string;
  }

  if (
    "data" in data &&
    data?.data &&
    typeof (data as Record<string, unknown>).data === "object" &&
    (data as { data: Record<string, unknown> }).data.accessToken &&
    typeof (data as { data: Record<string, unknown> }).data.accessToken ===
      "string"
  ) {
    return (data as { data: Record<string, unknown> }).data
      .accessToken as string;
  }

  if (
    "token" in data &&
    typeof (data as Record<string, unknown>).token === "string"
  ) {
    return (data as Record<string, unknown>).token as string;
  }

  return null;
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await refreshClient.post("/auth/refresh-token");
    return getAccessTokenFromResponse(response.data);
  } catch {
    return null;
  }
};

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const addPendingRequest = (callback: (token: string | null) => void) => {
  pendingRequests.push(callback);
};

const resolvePendingRequests = (token: string | null) => {
  pendingRequests.forEach((callback) => callback(token));
  pendingRequests = [];
};

const attachAuthorizationHeader = (
  headers: InternalAxiosRequestConfig["headers"],
  token: string
): AxiosRequestHeaders => {
  // Case 1: Là instance của AxiosHeaders
  if (headers instanceof AxiosHeaders) {
    headers.set("Authorization", `Bearer ${token}`);
    return headers;
  }

  // Case 2: Là object headers thường
  if (headers && typeof headers === "object" && !Array.isArray(headers)) {
    // Ép kiểu tường minh sang Partial<RawAxiosHeaders> để TypeScript chấp nhận
    const newHeaders: Record<string, string> = {
      ...(headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    };
    return new AxiosHeaders(newHeaders);
  }

  // Case 3: headers undefined hoặc kiểu lạ
  return new AxiosHeaders({
    Authorization: `Bearer ${token}`,
  });
};

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    const requestUrl = config.url ?? "";
    const isAuthRequest = authExemptEndpoints.some((endpoint) =>
      requestUrl.includes(endpoint)
    );

    if (token && !isAuthRequest) {
      config.headers = attachAuthorizationHeader(config.headers, token);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfigWithRetry | undefined;
    const status = error.response?.status;

    if (!originalRequest || !status) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    const isAuthRequest = authExemptEndpoints.some((endpoint) =>
      requestUrl.includes(endpoint)
    );

    if (status === 401 && !isAuthRequest) {
      if (originalRequest._retry) {
        useAuthStore.getState().clearState();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addPendingRequest((token) => {
            if (token) {
              originalRequest.headers = attachAuthorizationHeader(
                originalRequest.headers,
                token
              );
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          useAuthStore.getState().setAccessToken(newToken);
          resolvePendingRequests(newToken);
          originalRequest.headers = attachAuthorizationHeader(
            originalRequest.headers,
            newToken
          );
          return api(originalRequest);
        }

        resolvePendingRequests(null);
        useAuthStore.getState().clearState();
        return Promise.reject(error);
      } catch (refreshError) {
        resolvePendingRequests(null);
        useAuthStore.getState().clearState();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403 && !isAuthRequest) {
      useAuthStore.getState().clearState();
    }

    return Promise.reject(error);
  }
);

export default api;

export const extractApiErrorMessage = (
  error: unknown,
  fallback = "Đã có lỗi xảy ra"
): string => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const response = (error as { response?: unknown }).response;
  if (response && typeof response === "object") {
    const data = (response as { data?: unknown }).data;
    if (data) {
      if (typeof data === "string" && data.trim()) {
        return data;
      }

      if (typeof data === "object") {
        const message = (data as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) {
          return message;
        }

        const errorText = (data as { error?: unknown }).error;
        if (typeof errorText === "string" && errorText.trim()) {
          return errorText;
        }

        const nested = (data as { data?: unknown }).data;
        if (nested && typeof nested === "object") {
          const nestedMessage = (nested as { message?: unknown }).message;
          if (typeof nestedMessage === "string" && nestedMessage.trim()) {
            return nestedMessage;
          }
        }
      }
    }
  }

  const directMessage = (error as { message?: unknown }).message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  return fallback;
};
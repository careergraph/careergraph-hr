import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../custom/button/Button";
import GoogleAuth from "./GoogleAuth";
import XAuth from "./XAuth";
import authService, { LoginResponse } from "@/services/authService";
import accountService from "@/services/accountService";
import companyService from "@/services/companyService";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser, CompanyProfile } from "@/types/account";

const signInSchema = z.object({
  email: z.string({ required_error: "Email là bắt buộc" }).email("Email không hợp lệ"),
  password: z
    .string({ required_error: "Mật khẩu là bắt buộc" })
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
  rememberMe: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const traverseForMatch = (
  source: unknown,
  predicate: (candidate: Record<string, unknown>) => boolean
): Record<string, unknown> | null => {
  const stack: unknown[] = [source];

  while (stack.length > 0) {
    const current = stack.pop();

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    if (!isObject(current)) continue;

    if (predicate(current)) {
      return current;
    }

    stack.push(...Object.values(current));
  }

  return null;
};

const extractAuthUser = (payload: LoginResponse, fallbackEmail: string): AuthUser | null => {
  if (!payload) {
    return fallbackEmail ? { email: fallbackEmail } : null;
  }

  const userRecord = traverseForMatch(payload, (candidate) => {
    if (typeof candidate.email === "string" && candidate.email.includes("@")) {
      return true;
    }

    const hasName = typeof candidate.firstName === "string" || typeof candidate.lastName === "string";
    const hasIdentifier = typeof candidate.id === "string" || typeof candidate.companyId === "string";

    return hasName && hasIdentifier;
  });

  if (!userRecord) {
    return fallbackEmail ? { email: fallbackEmail } : null;
  }

  const normalizedUser: AuthUser = { ...(userRecord as AuthUser) };

  if (!normalizedUser.email && fallbackEmail) {
    normalizedUser.email = fallbackEmail;
  }

  const embeddedCompany = traverseForMatch(payload, (candidate) => {
    return (
      typeof candidate.companyId === "string" ||
      (typeof candidate.name === "string" && ("avatar" in candidate || "cover" in candidate))
    );
  });

  if (!normalizedUser.company && embeddedCompany) {
    normalizedUser.company = {
      id: typeof embeddedCompany.companyId === "string" ? embeddedCompany.companyId : undefined,
      name: typeof embeddedCompany.name === "string" ? embeddedCompany.name : undefined,
      avatar: typeof embeddedCompany.avatar === "string" ? embeddedCompany.avatar : undefined,
      cover: typeof embeddedCompany.cover === "string" ? embeddedCompany.cover : undefined,
      size: typeof embeddedCompany.size === "string" ? embeddedCompany.size : undefined,
      website: typeof embeddedCompany.website === "string" ? embeddedCompany.website : undefined,
    } satisfies CompanyProfile;

    if (!normalizedUser.companyId && normalizedUser.company?.id) {
      normalizedUser.companyId = normalizedUser.company.id;
    }
  }

  return normalizedUser;
};

const extractAccessToken = (payload: LoginResponse): string | null => {
  if (!payload) return null;

  const tokenRecord = traverseForMatch(payload, (candidate) => {
    return (
      typeof candidate.accessToken === "string" ||
      typeof candidate["access_token"] === "string" ||
      (typeof candidate.token === "string" && candidate.token.includes("."))
    );
  });

  if (!tokenRecord) return null;

  if (typeof tokenRecord.accessToken === "string") return tokenRecord.accessToken;
  if (typeof tokenRecord["access_token"] === "string") return tokenRecord["access_token"] as string;
  if (typeof tokenRecord.token === "string") return tokenRecord.token;

  return null;
};

const toVietnameseMessage = (raw?: string | null) => {
  if (!raw) return null;

  const normalized = raw.trim().toLowerCase();

  if (normalized.includes("account") && normalized.includes("not found")) {
    return "Tài khoản không tồn tại.";
  }

  if (normalized.includes("invalid") && normalized.includes("credential")) {
    return "Email hoặc mật khẩu không chính xác.";
  }

  if (normalized.includes("password") && normalized.includes("expired")) {
    return "Mật khẩu đã hết hạn. Vui lòng đặt lại mật khẩu.";
  }

  return null;
};

const resolveErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    const vietnamese = toVietnameseMessage(data?.message ?? data?.error);
    if (vietnamese) return vietnamese;
    return data?.message ?? data?.error ?? "Đăng nhập thất bại. Vui lòng thử lại.";
  }

  if (error instanceof Error) {
    const vietnamese = toVietnameseMessage(error.message);
    if (vietnamese) return vietnamese;
    return error.message;
  }

  return "Đăng nhập thất bại. Vui lòng thử lại.";
};

export default function SignInForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { errors, isSubmitting } = formState;

  const { setAccessToken, setUser, updateUser, setCompany, setIsAuthenticating, isAuthenticating } =
    useAuthStore();

  const onSubmit = async (values: SignInFormValues) => {
    setIsAuthenticating(true);

    let token: string | null = null;

    try {
      const response = await authService.login({
        email: values.email.trim(),
        password: values.password,
      });

      token = extractAccessToken(response);

      if (!token) {
        throw new Error("Không nhận được access token từ phản hồi.");
      }

      setAccessToken(token);
      const authUser = extractAuthUser(response, values.email.trim());
      setUser(authUser);

      try {
        const [currentAccount, currentCompany] = await Promise.all([
          accountService.getCurrentAccount(),
          companyService.getMyCompany(),
        ]);

        if (currentAccount) {
          updateUser(currentAccount);
        }

        if (currentCompany) {
          setCompany(currentCompany);
          updateUser({ company: currentCompany, companyId: currentCompany.id });
        }
      } catch (currentError) {
        console.error("Không thể tải dữ liệu tài khoản hoặc công ty", currentError);
      }

      toast.success("Đăng nhập thành công!");
      navigate("/dashboard");
    } catch (error) {
      if (!token) {
        const message = resolveErrorMessage(error);
        toast.error(message);
      } else {
        console.error("Đăng nhập thành công nhưng gặp lỗi trong quá trình xử lý bổ sung", error);
        toast.error("Đăng nhập thành công nhưng không thể tải đủ thông tin. Vui lòng thử lại sau.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const submitting = isSubmitting || isAuthenticating;

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Quay về trang chủ
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Đăng nhập
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vui lòng nhập email và mật khẩu để đăng nhập
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <GoogleAuth />
              <XAuth />
            </div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <Input
                        type="email"
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="info@gmail.com"
                        error={!!errors.email}
                        hint={errors.email?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>
                    Mật khẩu <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Controller
                      control={control}
                      name="password"
                      render={({ field }) => (
                        <Input
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          error={!!errors.password}
                          hint={errors.password?.message}
                          endAdornment={
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                            >
                              {showPassword ? (
                                <EyeIcon className="size-5" />
                              ) : (
                                <EyeCloseIcon className="size-5" />
                              )}
                            </button>
                          }
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Controller
                      control={control}
                      name="rememberMe"
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value ?? false}
                          onChange={(checked) => field.onChange(checked)}
                        />
                      )}
                    />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Ghi nhớ đăng nhập
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                
                <div>
                  <Button className="w-full" size="sm" disabled={submitting}>
                    {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Chưa có tài khoản? {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Đăng ký
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

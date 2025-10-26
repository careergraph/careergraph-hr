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
import { useAuthStore, type AuthUser } from "@/stores/authStore";

const signInSchema = z.object({
  email: z.string({ required_error: "Email là bắt buộc" }).email("Email không hợp lệ"),
  password: z
    .string({ required_error: "Mật khẩu là bắt buộc" })
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
  rememberMe: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const extractAuthUser = (payload: LoginResponse, fallbackEmail: string): AuthUser | null => {
  if (!payload) return null;

  if (payload.user && typeof payload.user === "object") {
    return payload.user as AuthUser;
  }

  if (
    "data" in payload &&
    payload.data &&
    typeof (payload.data as Record<string, unknown>).user === "object"
  ) {
    return (payload.data as { user: AuthUser }).user;
  }

  return fallbackEmail ? { email: fallbackEmail } : null;
};

const extractAccessToken = (payload: LoginResponse): string | null => {
  if (!payload) return null;

  if (payload.accessToken && typeof payload.accessToken === "string") {
    return payload.accessToken;
  }

  if (
    "data" in payload &&
    payload.data &&
    typeof (payload.data as Record<string, unknown>).accessToken === "string"
  ) {
    return (payload.data as { accessToken: string }).accessToken;
  }

  if (typeof payload.token === "string") {
    return payload.token;
  }

  return null;
};

const resolveErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? "Đăng nhập thất bại. Vui lòng thử lại.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đăng nhập thất bại. Vui lòng thử lại.";
};

export default function SignInForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { errors, isSubmitting } = formState;

  const { setAccessToken, setUser, setIsAuthenticating, isAuthenticating } = useAuthStore();

  const onSubmit = async (values: SignInFormValues) => {
    setFormError(null);
    setIsAuthenticating(true);

    try {
      const response = await authService.login({
        email: values.email.trim(),
        password: values.password,
      });

      const token = extractAccessToken(response);

      if (!token) {
        throw new Error("Không nhận được access token từ phản hồi.");
      }

      setAccessToken(token);
      const authUser = extractAuthUser(response, values.email.trim());
      setUser(authUser);

      toast.success("Đăng nhập thành công!");
      navigate("/jobs");
    } catch (error) {
      const message = resolveErrorMessage(error);
      setFormError(message);
      toast.error(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const submitting = isSubmitting || isAuthenticating;

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
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
                        />
                      )}
                    />
                    <span
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
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
                {formError && (
                  <p className="text-sm text-error-500 bg-error-50 border border-error-100 rounded-lg px-4 py-3">
                    {formError}
                  </p>
                )}
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

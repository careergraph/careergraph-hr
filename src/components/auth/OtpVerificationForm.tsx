import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ChevronLeftIcon } from "@/icons";
import Label from "@/components/form/Label";
import authService from "@/services/authService";
import { getOtpContext, clearOtpContext } from "@/utils/otpStorage";
import { useOtpCountdown } from "@/hooks/useOtpCountdown";
import Otp6Input from "./Otp6Input";

type Purpose = "verify_email" | "reset_password";

const otpSchema = z.object({
  otp: z
    .string({ required_error: "OTP là bắt buộc" })
    .regex(/^\d{6}$/, "OTP phải gồm đúng 6 chữ số"),
  purpose: z.enum(["verify_email", "reset_password"]),
});

type OtpFormValues = z.infer<typeof otpSchema>;

const toVietnameseMessage = (raw?: string | null) => {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s.includes("invalid otp") || s.includes("otp invalid") || s.includes("otp") && s.includes("expire")) {
    return "OTP không hợp lệ hoặc đã hết hạn.";
  }
  if (s.includes("not found") && s.includes("account")) return "Không tìm thấy tài khoản.";
  return null;
};

const resolveErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    const vn = toVietnameseMessage(data?.message ?? data?.error);
    if (vn) return vn;
    return data?.message ?? data?.error ?? "Thao tác không thành công. Vui lòng thử lại.";
  }
  if (error instanceof Error) {
    const vn = toVietnameseMessage(error.message);
    if (vn) return vn;
    return error.message;
  }
  return "Thao tác không thành công. Vui lòng thử lại.";
};

export default function OtpVerificationForm() {
  const navigate = useNavigate();

  // Ưu tiên lấy từ location.state; nếu thiếu thì lấy từ localStorage (giữ đồng bộ giữa các tab)
  const initialEmail = getOtpContext()?.email ?? "";
  const initialPurpose: Purpose = (getOtpContext()?.purpose as Purpose) ?? "verify_email";
  const initialRedirectTo = getOtpContext()?.redirectTo ?? "/";

  const [formError, setFormError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const { secondsLeft, canResend, startOrSync } = useOtpCountdown();

  const { control, handleSubmit, formState, setValue } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
      purpose: initialPurpose,
    },
  });

  const { errors, isSubmitting } = formState;

  useEffect(() => {
    if (!initialEmail) {
      startOrSync(0);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const res = await authService.getTtlOtp(initialEmail);
        // giả sử BE trả số giây còn lại; nếu trả ms thì đổi ở mục 3
        if (!alive) return;
        const ttlSec = Number(res?.data ?? 0);
        startOrSync(ttlSec);
      } catch (err) {
        console.error("Lỗi khi lấy TTL OTP:", err);
        startOrSync(0);
      }
    })();

    return () => { alive = false; };
  }, [initialEmail, startOrSync]);


  const title = useMemo(
    () =>
      initialPurpose === "verify_email"
        ? "Xác thực email"
        : "Xác thực OTP quên mật khẩu",
    [initialPurpose]
  );

  const description = useMemo(
    () =>
      initialPurpose === "verify_email"
        ? `Nhập mã OTP đã gửi tới ${initialEmail} để kích hoạt tài khoản.`
        : `Nhập mã OTP đã gửi tới ${initialEmail} để tiếp tục đặt lại mật khẩu.`,
    [initialPurpose,initialEmail]
  );

  const onSubmit = async (values: OtpFormValues) => {
    setFormError(null);
    try {
      if (values.purpose === "verify_email") {
        await authService.verifyOTPRegister({ email: initialEmail,otp: Number(values.otp.trim()) });
        toast.success("Xác thực email thành công! Bạn có thể đăng nhập.");
        clearOtpContext();
        navigate(initialRedirectTo, { state: { email: initialEmail } });
      } else {
        // reset_password: xác thực OTP, BE trả resetToken
        await authService.verifyOTPResetPassword({
          email: initialEmail,
          otp: Number(values.otp.trim()),
        });
        toast.success("OTP hợp lệ! Vui lòng đặt lại mật khẩu.");
        // chuyển qua form đặt mật khẩu, kèm token
        
        navigate("/reset-password", {
          state: { email: initialEmail },
        });
      }
    } catch (err) {
      const message = resolveErrorMessage(err);
      toast.error(message);
    }
  };

  const handleResend = async () => {
    if (!initialEmail) {
      toast.error("Thiếu email để gửi lại OTP.");
      return;
    }
    try {
      setResending(true);
      const data = await authService.resendOtp({
        email: initialEmail.trim()
      });
      startOrSync(data);
      toast.success("Đã gửi lại OTP! Vui lòng kiểm tra email.");
    } catch (err) {
      toast.error(resolveErrorMessage(err));
    } finally {
      setResending(false);
    }
  };



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
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5">

              <div>
                <Label>
                  Mã OTP (6 chữ số)<span className="text-error-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="otp"
                  render={({ field }) => (
                    <>
                      <Otp6Input
                        name={field.name}
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        disabled={isSubmitting}
                      />
                      {errors.otp && (
                        <p className="mt-2 text-sm text-error-500">{errors.otp.message}</p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* purpose ẩn nhưng vẫn submit */}
              <Controller
                control={control}
                name="purpose"
                render={({ field }) => (
                  <input type="hidden" name={field.name} value={field.value} />
                )}
              />

              {formError && (
                <p className="text-sm text-error-500 bg-error-50 border border-error-100 rounded-lg px-4 py-3">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || resending}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/60"
                >
                  {resending
                    ? "Đang gửi lại..."
                    : canResend
                    ? "Gửi lại OTP"
                    : `Gửi lại sau ${secondsLeft}s`}
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xác thực..." : "Xác thực"}
                </button>
              </div>

              {initialPurpose === "reset_password" ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nhập đúng OTP để chuyển qua bước đặt lại mật khẩu.
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sau khi xác thực email thành công, bạn có thể đăng nhập.
                </p>
              )}
            </div>
          </form>

          <div className="mt-5">
            {initialPurpose === "reset_password" ? (
              <p className="text-sm text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Nhớ mật khẩu rồi?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Đăng nhập
                </Link>
              </p>
            ) : (
              <p className="text-sm text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Đã có tài khoản?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Đăng nhập
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ChevronLeftIcon, EyeIcon, EyeCloseIcon } from "@/icons";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import authService from "@/services/authService";
import { clearOtpContext, getOtpContext } from "@/utils/otpStorage";

const schema = z
  .object({
    newPassword: z.string({ required_error: "Mật khẩu mới là bắt buộc" }).min(6, "Tối thiểu 6 ký tự"),
    confirmPassword: z.string({ required_error: "Xác nhận mật khẩu là bắt buộc" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type FormValues = z.infer<typeof schema>;

const resolveErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
  }
  if (error instanceof Error) return error.message;
  return "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
};

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation() as unknown as {
    state?: { email?: string };
  };
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

   const email = getOtpContext()?.email ?? "";
  // Token có thể lấy từ location.state hoặc sessionStorage (được set từ bước OTP)

  useEffect(() => {
    if (!email) {
      // Nếu không có token, đưa về xin OTP lại
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const { errors, isSubmitting } = formState;

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await authService.resetPassword({
        newPassword: values.newPassword,
      });
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      // dọn token sau khi thành công
      clearOtpContext();
      navigate("/signin");
    } catch (err) {
      const msg = resolveErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
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
              Đặt lại mật khẩu
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5">
              <div>
                <Label>
                  Mật khẩu mới<span className="text-error-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field }) => (
                    <Input
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Nhập mật khẩu mới"
                      type={showNew ? "text" : "password"}
                      error={!!errors.newPassword}
                      hint={errors.newPassword?.message}
                      endAdornment={
                        <button
                          type="button"
                          onClick={() => setShowNew((v) => !v)}
                          className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          aria-label={showNew ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                        >
                          {showNew ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                        </button>
                      }
                    />
                  )}
                />
              </div>

              <div>
                <Label>
                  Xác nhận mật khẩu<span className="text-error-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <Input
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Nhập lại mật khẩu mới"
                      type={showConfirm ? "text" : "password"}
                      error={!!errors.confirmPassword}
                      hint={errors.confirmPassword?.message}
                      endAdornment={
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                        >
                          {showConfirm ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                        </button>
                      }
                    />
                  )}
                />
              </div>

              {formError && (
                <p className="text-sm text-error-500 bg-error-50 border border-error-100 rounded-lg px-4 py-3">
                  {formError}
                </p>
              )}

              <div>
                <button
                  type="submit"
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
              </div>

              <p className="text-sm text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Nhớ mật khẩu rồi?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

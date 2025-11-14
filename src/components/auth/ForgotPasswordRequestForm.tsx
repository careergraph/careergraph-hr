import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ChevronLeftIcon } from "@/icons";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import authService from "@/services/authService";
import { saveOtpContext, getOtpContext } from "@/utils/otpStorage";

const schema = z.object({
  email: z.string({ required_error: "Email là bắt buộc" }).email("Email không hợp lệ"),
});

type FormValues = z.infer<typeof schema>;

const resolveErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? "Không thể gửi OTP. Vui lòng thử lại.";
  }
  if (error instanceof Error) return error.message;
  return "Không thể gửi OTP. Vui lòng thử lại.";
};

export default function ForgotPasswordRequestForm() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const { errors, isSubmitting } = formState;

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      const res = await authService.forgotPassword({email: values.email.trim()});
      if(res?.status === "OK"){
        toast.success("Đã gửi OTP đến email. Vui lòng kiểm tra hộp thư.")
        saveOtpContext({email: values.email.trim(),purpose: "reset_password",redirectTo: "/reset-password", })
        navigate("/verify-otp", {
          replace: true
        })

      }
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
              Quên mật khẩu
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nhập email để nhận mã OTP đặt lại mật khẩu.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5">
              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
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
                      placeholder="Nhập email"
                      error={!!errors.email}
                      hint={errors.email?.message}
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
                  {isSubmitting ? "Đang gửi..." : "Gửi OTP"}
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

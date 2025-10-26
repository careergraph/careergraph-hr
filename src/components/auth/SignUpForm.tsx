import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import GoogleAuth from "./GoogleAuth";
import XAuth from "./XAuth";
import authService from "@/services/authService";

const signUpSchema = z.object({
  firstName: z.string({ required_error: "Họ là bắt buộc" }).min(1, "Họ là bắt buộc"),
  lastName: z.string({ required_error: "Tên là bắt buộc" }).min(1, "Tên là bắt buộc"),
  email: z.string({ required_error: "Email là bắt buộc" }).email("Email không hợp lệ"),
  password: z
    .string({ required_error: "Mật khẩu là bắt buộc" })
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Vui lòng đồng ý với điều khoản và chính sách." }),
  }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const resolveErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? "Đăng ký không thành công. Vui lòng thử lại.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đăng ký không thành công. Vui lòng thử lại.";
};

export default function SignUpForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { control, handleSubmit, formState, reset } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  const { errors, isSubmitting } = formState;

  const onSubmit = async (values: SignUpFormValues) => {
    setFormError(null);
    setFormSuccess(null);

    try {
      await authService.registerHr({
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      });

      const successMessage =
        "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận OTP trước khi đăng nhập.";
      toast.success(successMessage);
      setFormSuccess(successMessage);
      reset({ ...values, password: "", acceptTerms: true });

      setTimeout(() => {
        navigate("/signin", { state: { email: values.email.trim() } });
      }, 600);
    } catch (error) {
      const message = resolveErrorMessage(error);
      setFormError(message);
      toast.error(message);
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
              Đăng ký
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vui lòng nhập email và password để đăng ký tài khoản!
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
                  Hoặc
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>
                      Họ<span className="text-error-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="firstName"
                      render={({ field }) => (
                        <Input
                          type="text"
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Nhập họ và tên đệm (nếu có)"
                          error={!!errors.firstName}
                          hint={errors.firstName?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label>
                      Tên<span className="text-error-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="lastName"
                      render={({ field }) => (
                        <Input
                          type="text"
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Nhập tên"
                          error={!!errors.lastName}
                          hint={errors.lastName?.message}
                        />
                      )}
                    />
                  </div>
                </div>
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
                        placeholder="Nhập email"
                        error={!!errors.email}
                        hint={errors.email?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>
                    Mật khẩu<span className="text-error-500">*</span>
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
                          placeholder="Nhập mật khẩu"
                          type={showPassword ? "text" : "password"}
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
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Controller
                      control={control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <Checkbox
                          className="w-5 h-5 mt-1"
                          checked={field.value ?? false}
                          onChange={(checked) => field.onChange(checked)}
                        />
                      )}
                    />
                    <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                      Tạo tài khoản HR với CareerGraph bằng cách đồng ý với{" "}
                      <span className="text-gray-800 dark:text-white/90">Điều khoản dịch vụ</span>, và{" "}
                      <span className="text-gray-800 dark:text-white">Chính sách</span> của chúng tôi.
                    </p>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-xs text-error-500">{errors.acceptTerms.message}</p>
                  )}
                </div>
                {formError && (
                  <p className="text-sm text-error-500 bg-error-50 border border-error-100 rounded-lg px-4 py-3">
                    {formError}
                  </p>
                )}
                {formSuccess && (
                  <p className="text-sm text-success-600 bg-success-50 border border-success-200 rounded-lg px-4 py-3">
                    {formSuccess}
                  </p>
                )}
                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Đã có tài khoản? {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

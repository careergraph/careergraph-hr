import { FormEvent, ReactNode, useState } from "react";
import { toast } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import authService from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const axiosMessage = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    if (typeof axiosMessage === "string" && axiosMessage.trim()) {
      return axiosMessage;
    }

    const genericMessage = (error as { message?: unknown })?.message;
    if (typeof genericMessage === "string" && genericMessage.trim()) {
      return genericMessage;
    }
  }

  return fallback;
};

export default function AccountSettings() {
  const { user, updateUser, setCompany, company } = useAuthStore();

  const [openEmailModal, setOpenEmailModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState<"idle" | "otp">("idle");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [passwordStep, setPasswordStep] = useState<"idle" | "otp">("idle");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const currentEmail = user?.email ?? company?.email ?? "";

  const resetEmailState = () => {
    setNewEmail("");
    setEmailOtp("");
    setEmailStep("idle");
    setEmailError("");
  };

  const resetPasswordState = () => {
    setCurrentPassword("");
    setNewPassword("");
    setPasswordOtp("");
    setPasswordStep("idle");
    setPasswordError("");
  };

  const closeEmailModal = () => {
    if (loadingEmail) return;
    setOpenEmailModal(false);
    resetEmailState();
  };

  const closePasswordModal = () => {
    if (loadingPassword) return;
    setOpenPasswordModal(false);
    resetPasswordState();
  };

  const submitEmailRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError("");

    if (!newEmail.trim()) {
      toast.error("Vui lòng nhập email mới");
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      const message = "Email mới phải khác email hiện tại";
      setEmailError(message);
      toast.error(message);
      return;
    }

    try {
      setLoadingEmail(true);
      await authService.requestEmailChangeOtp({ newEmail: newEmail.trim() });
      setEmailStep("otp");
      toast.success("Đã gửi OTP tới email mới");
    } catch (error) {
      const message = getErrorMessage(error, "Không thể gửi OTP đổi email");
      setEmailError(message);
      toast.error(message);
      console.error(error);
    } finally {
      setLoadingEmail(false);
    }
  };

  const submitEmailConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError("");

    if (!emailOtp.trim()) {
      toast.error("Vui lòng nhập OTP");
      return;
    }

    try {
      setLoadingEmail(true);
      await authService.confirmEmailChange({
        newEmail: newEmail.trim(),
        otp: emailOtp.trim(),
      });
      updateUser({ email: newEmail.trim() });
      if (company) {
        setCompany({ ...company, email: newEmail.trim() });
      }
      closeEmailModal();
      toast.success("Cập nhật email thành công");
    } catch (error) {
      const message = getErrorMessage(error, "OTP không hợp lệ hoặc đã hết hạn");
      setEmailError(message);
      toast.error(message);
      console.error(error);
    } finally {
      setLoadingEmail(false);
    }
  };

  const submitPasswordRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập đủ mật khẩu hiện tại và mới");
      return;
    }

    if (newPassword.length < 8) {
      const message = "Mật khẩu mới phải có ít nhất 8 ký tự";
      setPasswordError(message);
      toast.error(message);
      return;
    }

    try {
      setLoadingPassword(true);
      await authService.requestPasswordChangeOtp({
        currentPassword,
        newPassword,
      });
      setPasswordStep("otp");
      toast.success("Đã gửi OTP xác nhận đổi mật khẩu");
    } catch (error) {
      const message = getErrorMessage(error, "Không thể gửi OTP đổi mật khẩu");
      setPasswordError(message);
      toast.error(message);
      console.error(error);
    } finally {
      setLoadingPassword(false);
    }
  };

  const submitPasswordConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");

    if (!passwordOtp.trim()) {
      toast.error("Vui lòng nhập OTP");
      return;
    }

    try {
      setLoadingPassword(true);
      await authService.confirmPasswordChange({ otp: passwordOtp.trim() });
      closePasswordModal();
      toast.success("Đổi mật khẩu thành công");
    } catch (error) {
      const message = getErrorMessage(error, "OTP không hợp lệ hoặc đã hết hạn");
      setPasswordError(message);
      toast.error(message);
      console.error(error);
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <>
      <PageMeta title="HR - Cài đặt tài khoản" description="HR - Cài đặt tài khoản" />
      <PageBreadcrumb pageTitle="Cài đặt tài khoản" />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Email đăng nhập</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentEmail || "Chưa cập nhật"}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpenEmailModal(true)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5 sm:w-auto"
            >
              Chỉnh sửa
            </button>
          </div>

          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mật khẩu</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Đã thiết lập bảo mật</p>
            </div>
            <button
              type="button"
              onClick={() => setOpenPasswordModal(true)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5 sm:w-auto"
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>

      {openEmailModal && (
        <ModalShell
          title="Cập nhật email"
          subtitle="Hệ thống sẽ gửi OTP về email mới để xác nhận."
          onClose={closeEmailModal}
        >
          <form className="space-y-4" onSubmit={emailStep === "idle" ? submitEmailRequest : submitEmailConfirm}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email hiện tại</label>
              <input
                type="email"
                value={currentEmail}
                disabled
                title="Email hiện tại"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email mới</label>
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                disabled={emailStep === "otp" || loadingEmail}
                title="Email mới"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
                required
              />
            </div>

            {emailStep === "otp" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mã OTP</label>
                <input
                  type="text"
                  value={emailOtp}
                  onChange={(event) => setEmailOtp(event.target.value)}
                  title="Mã OTP email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Nhập 6 chữ số"
                  required
                />
              </div>
            )}

            {emailError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {emailError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  emailStep === "otp"
                    ? () => {
                        setEmailStep("idle");
                        setEmailOtp("");
                        setEmailError("");
                      }
                    : closeEmailModal
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
                disabled={loadingEmail}
              >
                {emailStep === "otp" ? "Quay lại" : "Huỷ"}
              </button>
              <button
                type="submit"
                disabled={loadingEmail}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {loadingEmail ? "Đang xử lý..." : emailStep === "idle" ? "Gửi OTP" : "Xác nhận"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {openPasswordModal && (
        <ModalShell
          title="Đổi mật khẩu"
          subtitle="Nhập mật khẩu hiện tại, mật khẩu mới và xác thực OTP."
          onClose={closePasswordModal}
        >
          <form className="space-y-4" onSubmit={passwordStep === "idle" ? submitPasswordRequest : submitPasswordConfirm}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={passwordStep === "otp" || loadingPassword}
                title="Mật khẩu hiện tại"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={passwordStep === "otp" || loadingPassword}
                title="Mật khẩu mới"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
                minLength={8}
                required
              />
            </div>

            {passwordStep === "otp" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mã OTP</label>
                <input
                  type="text"
                  value={passwordOtp}
                  onChange={(event) => setPasswordOtp(event.target.value)}
                  title="Mã OTP mật khẩu"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Nhập 6 chữ số"
                  required
                />
              </div>
            )}

            {passwordError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {passwordError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  passwordStep === "otp"
                    ? () => {
                        setPasswordStep("idle");
                        setPasswordOtp("");
                        setPasswordError("");
                      }
                    : closePasswordModal
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
                disabled={loadingPassword}
              >
                {passwordStep === "otp" ? "Quay lại" : "Huỷ"}
              </button>
              <button
                type="submit"
                disabled={loadingPassword}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {loadingPassword ? "Đang xử lý..." : passwordStep === "idle" ? "Gửi OTP" : "Xác nhận"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
}

type ModalShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
};

function ModalShell({ title, subtitle, children, onClose }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Đóng" className="absolute inset-0 bg-gray-900/50" onClick={onClose} />

      <div className="relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:max-w-md sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">{children}</div>
      </div>
    </div>
  );
}

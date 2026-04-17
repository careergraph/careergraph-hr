import { FormEvent, useState } from "react";
import { toast } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import authService from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

export default function AccountSettings() {
  const { user, updateUser, setCompany, company } = useAuthStore();

  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState<"idle" | "otp">("idle");
  const [loadingEmail, setLoadingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [passwordStep, setPasswordStep] = useState<"idle" | "otp">("idle");
  const [loadingPassword, setLoadingPassword] = useState(false);

  const currentEmail = user?.email ?? company?.email ?? "";

  const submitEmailRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!newEmail.trim()) {
      toast.error("Vui lòng nhập email mới");
      return;
    }

    try {
      setLoadingEmail(true);
      await authService.requestEmailChangeOtp({ newEmail: newEmail.trim() });
      setEmailStep("otp");
      toast.success("Đã gửi OTP tới email mới");
    } catch (error) {
      toast.error("Không thể gửi OTP đổi email");
      console.error(error);
    } finally {
      setLoadingEmail(false);
    }
  };

  const submitEmailConfirm = async (event: FormEvent) => {
    event.preventDefault();
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
      setEmailStep("idle");
      setEmailOtp("");
      setNewEmail("");
      toast.success("Cập nhật email thành công");
    } catch (error) {
      toast.error("OTP không hợp lệ hoặc đã hết hạn");
      console.error(error);
    } finally {
      setLoadingEmail(false);
    }
  };

  const submitPasswordRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập đủ mật khẩu hiện tại và mới");
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
      toast.error("Không thể gửi OTP đổi mật khẩu");
      console.error(error);
    } finally {
      setLoadingPassword(false);
    }
  };

  const submitPasswordConfirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordOtp.trim()) {
      toast.error("Vui lòng nhập OTP");
      return;
    }

    try {
      setLoadingPassword(true);
      await authService.confirmPasswordChange({ otp: passwordOtp.trim() });
      setPasswordStep("idle");
      setPasswordOtp("");
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Đổi mật khẩu thành công");
    } catch (error) {
      toast.error("OTP không hợp lệ hoặc đã hết hạn");
      console.error(error);
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <>
      <PageMeta title="HR - Cài đặt tài khoản" description="HR - Cài đặt tài khoản" />
      <PageBreadcrumb pageTitle="Cài đặt tài khoản" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Đổi email</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Email hiện tại: {currentEmail || "Chưa cập nhật"}</p>

          <form className="mt-5 space-y-4" onSubmit={emailStep === "idle" ? submitEmailRequest : submitEmailConfirm}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email mới</label>
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
                disabled={emailStep === "otp"}
                required
              />
            </div>

            {emailStep === "otp" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">OTP</label>
                <input
                  type="text"
                  value={emailOtp}
                  onChange={(event) => setEmailOtp(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Nhập 6 chữ số"
                  required
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              {emailStep === "otp" && (
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                  onClick={() => {
                    setEmailStep("idle");
                    setEmailOtp("");
                  }}
                >
                  Quay lại
                </button>
              )}
              <button
                type="submit"
                disabled={loadingEmail}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loadingEmail
                  ? "Đang xử lý..."
                  : emailStep === "idle"
                  ? "Gửi OTP"
                  : "Xác nhận cập nhật"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Đổi mật khẩu</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Yêu cầu OTP để hoàn tất thay đổi.</p>

          <form className="mt-5 space-y-4" onSubmit={passwordStep === "idle" ? submitPasswordRequest : submitPasswordConfirm}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
                disabled={passwordStep === "otp"}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
                disabled={passwordStep === "otp"}
                minLength={8}
                required
              />
            </div>

            {passwordStep === "otp" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">OTP</label>
                <input
                  type="text"
                  value={passwordOtp}
                  onChange={(event) => setPasswordOtp(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Nhập 6 chữ số"
                  required
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              {passwordStep === "otp" && (
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                  onClick={() => {
                    setPasswordStep("idle");
                    setPasswordOtp("");
                  }}
                >
                  Quay lại
                </button>
              )}
              <button
                type="submit"
                disabled={loadingPassword}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loadingPassword
                  ? "Đang xử lý..."
                  : passwordStep === "idle"
                  ? "Gửi OTP"
                  : "Xác nhận cập nhật"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

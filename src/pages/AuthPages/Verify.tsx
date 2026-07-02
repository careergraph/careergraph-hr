import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import OtpVerificationForm from "@/components/auth/OtpVerificationForm";


export default function Verify() {
  return (
    <>
      {/* Metadata và bố cục dùng chung cho trang Xác thực OTP. */}
      <PageMeta
        title="Xác thực OTP | CareerGraph HR"
        description="Xác thực email hoặc OTP đặt lại mật khẩu cho tài khoản CareerGraph HR"
      />
      <AuthLayout>
        <OtpVerificationForm />
      </AuthLayout>
    </>
  );
}

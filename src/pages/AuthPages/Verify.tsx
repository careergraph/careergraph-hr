import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import OtpVerificationForm from "@/components/auth/OtpVerificationForm";


export default function Verify() {
  return (
    <>
      {/* Metadata và bố cục dùng chung cho trang Xác thực OTP. */}
      <PageMeta
        title="HR - CareerGraph"
        description=""
      />
      <AuthLayout>
        <OtpVerificationForm />
      </AuthLayout>
    </>
  );
}
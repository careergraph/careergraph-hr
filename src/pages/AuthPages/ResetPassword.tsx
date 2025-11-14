import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";


export default function ResetPassword() {
  return (
    <>
      {/* Metadata và bố cục dùng chung cho trang Xác thực OTP. */}
      <PageMeta
        title="HR - CareerGraph"
        description=""
      />
      <AuthLayout>
        <ResetPasswordForm/>
      </AuthLayout>
    </>
  );
}
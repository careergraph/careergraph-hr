import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ForgotPasswordRequestForm from "@/components/auth/ForgotPasswordRequestForm";


export default function ForgotPassword() {
  return (
    <>
      {/* Metadata và bố cục dùng chung cho trang Xác thực OTP. */}
      <PageMeta
        title="HR - CareerGraph"
        description=""
      />
      <AuthLayout>
        <ForgotPasswordRequestForm />
      </AuthLayout>
    </>
  );
}
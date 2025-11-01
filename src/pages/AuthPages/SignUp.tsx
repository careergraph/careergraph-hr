import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "@/components/auth/SignUpForm";

// SignUp hiển thị form tạo tài khoản trong bố cục auth chung và thiết lập metadata.

export default function SignUp() {
  return (
    <>
      {/* Metadata và bố cục dùng chung cho trang đăng ký. */}
      <PageMeta
        title="HR - CareerGraph"
        description=""
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}

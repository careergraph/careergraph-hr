import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "@/components/auth/SignInForm";

// SignIn hiển thị form đăng nhập trong bố cục auth chung và thiết lập metadata.

export default function SignIn() {
  return (
    <>
      {/* Metadata và bố cục dùng chung cho trang đăng nhập. */}
      <PageMeta
        title="HR - CareerGraph"
        description=""
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}

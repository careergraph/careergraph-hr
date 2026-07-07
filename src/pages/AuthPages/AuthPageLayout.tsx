import React from "react";
import GridShape from "@/components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import AuthFooter from "./AuthFooter";

// AuthLayout cung cấp khung bố cục và phần thương hiệu dùng chung cho trang auth.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-1 min-h-screen bg-white dark:bg-gray-900 sm:p-0">
      {/* Bố cục bao bọc form đăng nhập/đăng ký với panel thương hiệu và nút đổi theme. */}
      <div className="relative flex min-h-screen w-full flex-col lg:h-screen lg:min-h-0 lg:flex-row dark:bg-gray-900 sm:p-0">
        <div className="flex min-h-screen w-full flex-col px-6 py-6 lg:min-h-0 lg:h-screen lg:w-1/2 lg:px-0 lg:py-0">
          <div className="flex flex-1 flex-col justify-center lg:items-center">
            {children}
          </div>
          <div className="mt-6 shrink-0 bg-white lg:mt-0 dark:bg-gray-900">
            <AuthFooter />
          </div>
        </div>
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img
                  width={231}
                  height={48}
                  src="/images/logo/logo.svg"
                  alt="Logo"
                />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                CareerGraph - HR <br />
                Nền tảng tìm kiếm ứng viên với sự kết nối thông minh và quy
                trình tiện lợi
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}

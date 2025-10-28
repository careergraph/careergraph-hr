import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import accountService from "@/services/accountService";
import companyService from "@/services/companyService";
import { useAuthStore } from "@/stores/authStore";

interface RequireAuthProps {
  redirectTo?: string;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ redirectTo = "/signin" }) => {
  const location = useLocation();
  const {
    accessToken,
    user,
    isAuthenticating,
    setIsAuthenticating,
    updateUser,
    setCompany,
    clearState,
    company,
  } = useAuthStore();

  const [isValidatingSession, setIsValidatingSession] = useState(false);

  useEffect(() => {
    if (!accessToken || user) return;

    let isMounted = true;

    const hydrateAccount = async () => {
      setIsValidatingSession(true);
      setIsAuthenticating(true);

      try {
        const profile = await accountService.getCurrentAccount();

        if (!isMounted) return;

        if (profile) {
          updateUser(profile);
          setCompany(profile.company ?? null);
          return;
        }

        clearState();
      } catch (error) {
        console.error("Không thể xác thực phiên đăng nhập", error);
        if (isMounted) {
          clearState();
        }
      } finally {
        if (isMounted) {
          setIsValidatingSession(false);
          setIsAuthenticating(false);
        }
      }
    };

    void hydrateAccount();

    return () => {
      isMounted = false;
    };
  }, [accessToken, user, updateUser, setCompany, clearState, setIsAuthenticating]);

  useEffect(() => {
    if (!accessToken || company) return;

    let isMounted = true;

    const hydrateCompany = async () => {
      try {
        const profile = await companyService.getMyCompany();
        if (!isMounted) return;

        if (profile) {
          setCompany(profile);
          updateUser({ company: profile, companyId: profile.id });
        }
      } catch (error) {
        console.error("Không thể tải thông tin công ty", error);
      }
    };

    void hydrateCompany();

    return () => {
      isMounted = false;
    };
  }, [accessToken, company, setCompany, updateUser]);

  if (!accessToken) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (isValidatingSession || (isAuthenticating && !user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
        Đang tải dữ liệu...
      </div>
    );
  }

  return <Outlet />;
};

export default RequireAuth;

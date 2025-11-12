import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import companyService from "@/services/companyService";
// RequireAuth is responsible for ensuring that a user is authenticated
// before allowing access to protected routes. It hydrates the company
// information when an access token is present but the app lacks company
// details. We intentionally do NOT call an `accountService.getCurrentAccount`
// here: the app already uses `/companies/me` to obtain company-scoped info
// and the user/profile hydration is handled elsewhere in the app.
import { useAuthStore } from "@/stores/authStore";

interface RequireAuthProps {
  redirectTo?: string;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ redirectTo = "/signin" }) => {
  const location = useLocation();
  const { accessToken, user, isAuthenticating, updateUser, setCompany, company } = useAuthStore();

  // NOTE: We intentionally do NOT hydrate an "account" from `/accounts/me` here.
  // The application uses `/companies/me` for company-scoped details and other
  // parts of the app handle user profile hydration. Keeping this component
  // focused on company hydration avoids redundant network calls and simplifies
  // the auth flow.

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

  if (isAuthenticating && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
        Đang tải dữ liệu...
      </div>
    );
  }

  return <Outlet />;
};

export default RequireAuth;

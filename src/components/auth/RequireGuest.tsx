import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/stores/authStore";

interface RequireGuestProps {
  redirectTo?: string;
}

const RequireGuest: React.FC<RequireGuestProps> = ({ redirectTo = "/dashboard" }) => {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);

  if (accessToken) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireGuest;

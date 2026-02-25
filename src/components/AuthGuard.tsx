import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authKey = localStorage.getItem("vnote");

    if (
      location.pathname === "/noteDetails/7" ||
      location.pathname === "/noteDetails/22"
    ) {
      return;
    }

    if (authKey !== "294") {
      navigate("/unauthorized", { replace: true });
    }
  }, [navigate, location.pathname]);

  const authKey = localStorage.getItem("vnote");

  if (
    location.pathname === "/noteDetails/7" ||
    location.pathname === "/noteDetails/22"
  ) {
    return <>{children}</>;
  }

  if (authKey !== "294") {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;

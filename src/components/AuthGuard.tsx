import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { verifyToken } from "../api";

interface AuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/noteDetails/49", "/noteDetails/22"];

const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Public paths don't need authentication
      if (PUBLIC_PATHS.includes(location.pathname)) {
        setIsAuthenticated(true);
        return;
      }

      const storedToken = localStorage.getItem("vnote");

      if (!storedToken) {
        setIsAuthenticated(false);
        navigate("/unauthorized", { replace: true });
        return;
      }

      // Verify token with backend
      const isValid = await verifyToken(storedToken);

      if (isValid) {
        setIsAuthenticated(true);
      } else {
        // Token is invalid, clear it and redirect
        localStorage.removeItem("vnote");
        setIsAuthenticated(false);
        navigate("/unauthorized", { replace: true });
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  // Public paths always render
  if (PUBLIC_PATHS.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Show nothing while checking authentication
  if (isAuthenticated === null || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;

import { useEffect } from "react";
import { useNavigate } from "react-router";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const authKey = localStorage.getItem("vnote");
    if (authKey !== "294") {
      navigate("/unauthorized", { replace: true });
    }
  }, [navigate]);
  
  const authKey = localStorage.getItem("vnote");
  if (authKey !== "294") {
    return null;
  }
  
  return <>{children}</>;
};

export default AuthGuard;

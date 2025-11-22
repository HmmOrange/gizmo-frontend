import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./AuthCallback.css"; // optional, but consistent

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      login(token);
      toast.success("Signed in successfully!");
      setTimeout(() => navigate("/"), 1000);
    } else {
      toast.error("OAuth login failed.");
      navigate("/login");
    }
  }, []);

  return <div className="auth-callback">Signing you in...</div>;
}

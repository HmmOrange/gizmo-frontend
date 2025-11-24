import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles.css";
import toast from "react-hot-toast";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { LoginForm } from "@/components/login-form";
import logoImage from '@/assets/logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/auth/login`,
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      localStorage.setItem("token", res.data.token);
      login(res.data.token);
      toast.success("Logged in successfully!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }

    setLoading(false);
  }

  function handleMicrosoftLogin() {
    setLoading(true);
    window.location.href = `${BACKEND_URL}/api/auth/oauth/microsoft`;
  }

  return (
    <div
      className="flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6 md:p-10"
      style={{ backgroundColor: "#f5f5f5" }}
    >
      <div className="flex items-center gap-3">
        {/* Ensure you have a logo image at this path or update it */}
        <img src={logoImage} alt="Gizmo" className="h-20 w-20" />
        <span className="text-4xl font-bold">Gizmo</span>
      </div>
      <div className="w-full max-w-sm">
        <LoginForm
          username={username}
          password={password}
          onUsernameChange={(e) => setUsername(e.target.value)}
          onPasswordChange={(e) => setPassword(e.target.value)}
          onSubmit={handleLogin}
          onMicrosoftLogin={handleMicrosoftLogin}
          loading={loading}
        />
      </div>
    </div>
  );
}

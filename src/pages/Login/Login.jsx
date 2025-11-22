import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles.css";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import { LoginForm } from "@/components/login-form";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.message || "Login failed");
      return;
    }
    localStorage.setItem("token", data.token);
    login(data.token);
    toast.success("Logged in successfully!");
    setTimeout(() => navigate("/"), 1000);
  }

  function handleMicrosoftLogin() {
    setLoading(true);
    window.location.href = "/api/auth/oauth/microsoft";
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
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

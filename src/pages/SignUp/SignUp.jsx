import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { SignupForm } from "@/components/signup-form";
import logoImage from '@/assets/logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function SignUp() {
  const navigate = useNavigate();
  const API_BASE = `${BACKEND_URL}/api/auth/signup`;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const body = { username, password, fullname: fullName };

    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      toast.error("Server error");
      return;
    }

    if (!res.ok) {
      toast.error(data.message || "Sign up failed");
      return;
    }

    toast.success("Account created successfully!");
    setTimeout(() => navigate("/login"), 1000);
  }

  function handleMicrosoftLogin() {
    setLoading(true);
    window.location.href = `${BACKEND_URL}/api/auth/oauth/microsoft`;
  }

  return (
    <div
      className="fixed inset-0 flex w-full flex-col items-center justify-center gap-6 p-6 md:p-10"
      style={{ backgroundColor: "#f5f5f5" }}
    >
      <div className="flex items-center gap-3">
        {/* Ensure you have a logo image at this path or update it */}
        <img src={logoImage} alt="Gizmo" className="h-20 w-20" />
        <span className="text-4xl font-bold">Gizmo</span>
      </div>
      <div className="w-full max-w-sm">
        <SignupForm
          username={username}
          fullname={fullName}
          password={password}
          confirmPassword={confirmPassword}
          onUsernameChange={(e) => setUsername(e.target.value)}
          onPasswordChange={(e) => setPassword(e.target.value)}
          onFullNameChange={(e) => setFullName(e.target.value)}
          onConfirmPasswordChange={(e) => setConfirmPassword(e.target.value)}
          onSubmit={handleSignUp}
          onMicrosoftLogin={handleMicrosoftLogin}
          loading={loading}
        />
      </div>
    </div>
  );
}

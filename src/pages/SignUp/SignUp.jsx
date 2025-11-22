import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { SignupForm } from "@/components/signup-form";

export default function SignUp() {
  const navigate = useNavigate();

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

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, name: fullName }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "Sign up failed");
      return;
    }

    toast.success("Account created successfully!");
    setTimeout(() => navigate("/login"), 1000);
  }

  function handleMicrosoftLogin() {
    setLoading(true);
    window.location.href = "/api/auth/oauth/microsoft";
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm
          username={username}
          fullName={fullName}
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

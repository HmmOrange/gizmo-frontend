import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("auth_token"));
  const [user, setUser] = useState(null);

  // Fetch user if logged in
  useEffect(() => {
    async function fetchUser() {
      if (!token) return setUser(null);

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setToken(null);
        localStorage.removeItem("auth_token");
      }
    }

    fetchUser();
  }, [token]);

  function login(newToken) {
    setToken(newToken);
    localStorage.setItem("auth_token", newToken);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

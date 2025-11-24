// Simple API utility for authenticated requests
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
export async function fetchUserProfile(token) {
  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return await res.json();
}

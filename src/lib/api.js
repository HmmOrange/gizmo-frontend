// Simple API utility for authenticated requests
export async function fetchUserProfile(token) {
  const res = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return await res.json();
}

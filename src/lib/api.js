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

export async function fetchUserPastes(token) {
  const res = await fetch('/api/pastes/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch pastes');
  return res.json();
}

export async function fetchUserAlbums(token) {
  const res = await fetch('/api/albums/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch albums');
  return res.json();
}

export async function fetchUserImages(token) {
  const res = await fetch('/api/images/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch images');
  return res.json();
}

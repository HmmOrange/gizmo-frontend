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

export async function updateUserProfile(token, updates) {
  const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return await res.json();
}

export async function changeUserPassword(token, currentPassword, newPassword) {
  const res = await fetch(`${BACKEND_URL}/api/user/password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message || 'Failed to change password');
  }
  return await res.json();
}

export async function fetchUserPastes(token) {
  const url = `${BACKEND_URL}/paste/me`;
  console.log('fetchUserPastes calling:', url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('fetchUserPastes response status:', res.status);
  if (!res.ok) throw new Error('Failed to fetch pastes');
  const data = await res.json();
  console.log('fetchUserPastes response data:', data);
  return data;
}

export async function fetchUserAlbums(token) {
  const url = `${BACKEND_URL}/api/albums/me`;
  console.log('fetchUserAlbums calling:', url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch albums');
  return res.json();
}

export async function fetchUserImages(token) {
  const url = `${BACKEND_URL}/api/images/me`;
  console.log('fetchUserImages calling:', url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch images');
  const data = await res.json();
  console.log('fetchUserImages response data:', data);
  return data;
}

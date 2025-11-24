import React, { useEffect, useState } from 'react';
import { fetchUserProfile } from '../../lib/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetchUserProfile(token)
      .then(setUser)
      .catch(err => setError(err.message));
  }, [token]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Profile</h1>
      {!token && <p>You are not logged in.</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {user && (
        <div>
          <p>Welcome, <b>{user.fullname || user.username}</b>!</p>
          <p><b>Username:</b> {user.username}</p>
          <p><b>UserID:</b> {user.userId}</p>
          {user.avatarUrl && <img src={user.avatarUrl} alt="avatar" style={{ width: 80, borderRadius: '50%' }} />}
        </div>
      )}
    </div>
  );
}

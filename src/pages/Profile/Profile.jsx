import React, { useEffect, useState } from 'react';
import { fetchUserProfile, fetchUserPastes, fetchUserAlbums, fetchUserImages } from '../../lib/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [pastes, setPastes] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [images, setImages] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetchUserProfile(token)
      .then(setUser)
      .catch(err => setError(err.message));
    // Fetch user's pastes
    fetchUserPastes(token)
      .then(setPastes)
      .catch(() => {});
    // Fetch user's albums
    fetchUserAlbums(token)
      .then(setAlbums)
      .catch(() => {});
    // Fetch user's images
    fetchUserImages(token)
      .then(setImages)
      .catch(() => {});
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

      {/* Paste List */}
      <div style={{ marginTop: '2rem', textAlign: 'left' }}>
        <h2>Your Pastes</h2>
        {pastes.length === 0 ? <p>No pastes found.</p> : (
          <ul>
            {pastes.map(paste => (
              <li key={paste.pasteId || paste.id}>
                <b>{paste.title || 'Untitled'}</b> - {paste.content?.slice(0, 50)}...
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Album List */}
      <div style={{ marginTop: '2rem', textAlign: 'left' }}>
        <h2>Your Albums</h2>
        {albums.length === 0 ? <p>No albums found.</p> : (
          <ul>
            {albums.map(album => (
              <li key={album._id || album.albumId}>
                <b>{album.name || 'Untitled Album'}</b> - {album.description || ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Image List */}
      <div style={{ marginTop: '2rem', textAlign: 'left' }}>
        <h2>Your Images</h2>
        {images.length === 0 ? <p>No images found.</p> : (
          <ul>
            {images.map(image => (
              <li key={image._id || image.imageId}>
                <b>{image.filename || 'Image'}</b> - {image.description || ''}
                {image.url && (
                  <div><img src={image.url} alt={image.filename} style={{ width: 80, marginTop: 4 }} /></div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserImages, fetchUserAlbums } from '../../lib/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function shortText(text, len = 120) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '...' : text;
}

export default function Gallery() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [bookmarkedImages, setBookmarkedImages] = useState([]);
  const [bookmarksObj, setBookmarksObj] = useState(null);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('views'); // 'views' or 'bookmarks'
  const [activeTab, setActiveTab] = useState('images'); // 'images' | 'albums' | 'bookmarks'

  useEffect(() => {
    if (!token) {
      setError('Please sign in to view your gallery');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const imgs = await fetchUserImages(token);
        console.log('fetchUserImages', imgs);
        const imgsArray = Array.isArray(imgs) ? imgs : (imgs.images || imgs);
        setImages(imgsArray || []);

        const albs = await fetchUserAlbums(token);
        const albsArray = Array.isArray(albs) ? albs : (albs.albums || albs);
        setAlbums(albsArray || []);

        // bookmarks via dashboard
        const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/dashboard/bookmarks`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (res.ok) {
          const json = await res.json();
          setBookmarksObj(json);
          setBookmarkedImages(json?.images || []);
        }
      } catch (err) {
        console.error('Gallery load error', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const totalImages = images.length;
  const totalAlbums = albums.length;
  const totalImageViews = images.reduce((s, it) => s + (Number(it.views) || 0), 0);
  const totalImageBookmarks = (bookmarksObj) ? (bookmarksObj.images?.length || 0) : 0;

  const filterAndSort = (items) => {
    const q = (query || '').trim().toLowerCase();
    let filtered = Array.isArray(items) ? items.slice() : [];
    if (q) filtered = filtered.filter(it => (it.title || it.name || it.caption || it.slug || '').toLowerCase().includes(q));

    const key = sortBy === 'views' ? 'views' : 'bookmarks';
    filtered.sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));
    return filtered;
  };

  const renderImageCard = (i) => (
    <div key={i._id || i.slug} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 10, background: 'white', cursor: 'pointer' }} onClick={() => navigate(`/i/image/${i.slug || i._id}`)}>
      <div style={{ fontWeight: 'bold' }}>{i.title || i.slug || 'Untitled'}</div>
      <div style={{ color: '#444', marginTop: 8 }}>{shortText(i.caption || i.description || '', 160)}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 12, color: '#666' }}>
        <div>Views: {i.views || 0}</div>
        <div>|</div>
        <div>Bookmarks: {i.bookmarks ?? i.bookmarkCount ?? 0}</div>
      </div>
    </div>
  );

  const renderAlbumCard = (a) => (
    <div key={a._id || a.slug} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 10, background: 'white', cursor: 'pointer' }} onClick={() => navigate(`/i/album/${a.slug || a._id}`)}>
      <div style={{ fontWeight: 'bold' }}>{a.name || a.slug || 'Untitled'}</div>
      <div style={{ color: '#444', marginTop: 8 }}>{shortText(a.description || '', 160)}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 12, color: '#666' }}>
        <div>Views: {a.views || 0}</div>
        <div>|</div>
        <div>Bookmarks: {a.bookmarks ?? a.bookmarkCount ?? 0}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Gallery</h1>

      {!token && <div style={{ color: 'red' }}>Please sign in to view this page.</div>}

      {token && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 160 }}>
              <div style={{ color: '#666', fontSize: 12 }}>Total Images</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{totalImages}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 160 }}>
              <div style={{ color: '#666', fontSize: 12 }}>Total Albums</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{totalAlbums}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 200 }}>
              <div style={{ color: '#666', fontSize: 12 }}>Total Image Views</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{totalImageViews}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 200 }}>
              <div style={{ color: '#666', fontSize: 12 }}>Your Image Bookmarks</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{totalImageBookmarks}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <button onClick={() => setActiveTab('images')} style={{ padding: 8, borderRadius: 8, background: activeTab === 'images' ? '#007bff' : '#f0f0f0', color: activeTab === 'images' ? 'white' : '#333', border: 'none' }}>My images</button>
            <button onClick={() => setActiveTab('albums')} style={{ padding: 8, borderRadius: 8, background: activeTab === 'albums' ? '#007bff' : '#f0f0f0', color: activeTab === 'albums' ? 'white' : '#333', border: 'none' }}>My albums</button>
            <button onClick={() => setActiveTab('bookmarks')} style={{ padding: 8, borderRadius: 8, background: activeTab === 'bookmarks' ? '#007bff' : '#f0f0f0', color: activeTab === 'bookmarks' ? 'white' : '#333', border: 'none' }}>Bookmarks</button>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input placeholder="Search by title" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd' }}>
              <option value="views">Sort by views</option>
              <option value="bookmarks">Sort by favourites</option>
            </select>
          </div>

          <div>
            {loading && <div>Loading...</div>}
            {!loading && error && <div style={{ color: 'red' }}>{error}</div>}

            {!loading && !error && activeTab === 'images' && (
              <div>
                {filterAndSort(images).length === 0 ? <div>No images found.</div> : filterAndSort(images).map(renderImageCard)}
              </div>
            )}

            {!loading && !error && activeTab === 'albums' && (
              <div>
                {filterAndSort(albums).length === 0 ? <div>No albums found.</div> : filterAndSort(albums).map(renderAlbumCard)}
              </div>
            )}

            {!loading && !error && activeTab === 'bookmarks' && (
              <div>
                {filterAndSort(bookmarkedImages).length === 0 ? <div>No bookmarks found.</div> : filterAndSort(bookmarkedImages).map(renderImageCard)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

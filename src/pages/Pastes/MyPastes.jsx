import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserPastes } from '../../lib/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function shortText(text, len = 120) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '...' : text;
}

export default function MyPastes() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [pastes, setPastes] = useState([]);
  const [bookmarkedPastes, setBookmarkedPastes] = useState([]);
  const [bookmarksObj, setBookmarksObj] = useState(null);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('views'); // 'views' or 'bookmarks'
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' or 'bookmarks'

  useEffect(() => {
    if (!token) {
      setError('Please sign in to view your pastes');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        // user pastes
        const p = await fetchUserPastes(token);
        console.log('Received from fetchUserPastes:', p);
        // fetchUserPastes may return array or { pastes: [] }
        const pastesArray = Array.isArray(p) ? p : (p.pastes || p);
        console.log('Processed pastes array:', pastesArray);
        setPastes(pastesArray || []);

        // user bookmarks (from dashboard endpoint)
        const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/dashboard/bookmarks`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (res.ok) {
          const json = await res.json();
          setBookmarksObj(json);
          // bookmarks.pastes may be an array
          const bp = json?.pastes || [];
          setBookmarkedPastes(bp || []);
        }
      } catch (err) {
        console.error('MyPastes load error', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const totalPastes = pastes.length;
  const totalViews = pastes.reduce((s, it) => s + (Number(it.views) || 0), 0);
  
  window.console.log(bookmarksObj);
  const totalBookmarksCount = (bookmarksObj)
    ? ((bookmarksObj.pastes?.length || 0))
    : 0;

  const filterAndSort = (items) => {
    const q = (query || '').trim().toLowerCase();
    let filtered = Array.isArray(items) ? items.slice() : [];
    if (q) filtered = filtered.filter(it => (it.title || it.slug || '').toLowerCase().includes(q));

    const key = sortBy === 'views' ? 'views' : 'bookmarks';
    filtered.sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));
    return filtered;
  };

  const renderPasteCard = (p) => (
    <div key={p.pasteId || p.slug || p.id || p._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 10, background: 'white', cursor: 'pointer' }} onClick={() => navigate(`/i/${p.slug || p.pasteId || p.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold' }}>{p.title || p.slug || 'Untitled'}</div>
        <div style={{ color: '#666', fontSize: 12 }}>{new Date(p.updatedAt || p.createdAt || p.createdAt).toLocaleString()}</div>
      </div>
      <div style={{ marginTop: 8, color: '#444' }}>{shortText(p.content || p.body || '', 160)}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 12, color: '#666' }}>
        <div>Views: {p.views || 0}</div>
        <div>|</div>
        <div>Favourites: {p.bookmarks ?? p.bookmarkCount ?? 0}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {!token && <div style={{ color: 'red' }}>Please sign in to view this page.</div>}

      {token && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 160 }}>
              <div style={{ color: '#666', fontSize: 12 }}>Total Pastes</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{totalPastes}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 200 }}>
              <div style={{ color: '#666', fontSize: 12 }}>Total Views (your pastes)</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{totalViews}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 200 }}>
              <div style={{ color: '#666', fontSize: 12 }}>Your Favourites</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{totalBookmarksCount}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <button onClick={() => setActiveTab('mine')} style={{ padding: 8, borderRadius: 8, background: activeTab === 'mine' ? '#007bff' : '#f0f0f0', color: activeTab === 'mine' ? 'white' : '#333', border: 'none' }}>My pastes</button>
            <button onClick={() => setActiveTab('bookmarks')} style={{ padding: 8, borderRadius: 8, background: activeTab === 'bookmarks' ? '#007bff' : '#f0f0f0', color: activeTab === 'bookmarks' ? 'white' : '#333', border: 'none' }}>Favourites</button>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input placeholder="Search by title" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd' }}>
              <option value="views">Sort by views</option>
              <option value="bookmarks">Sort by Favourites</option>
            </select>
          </div>

          <div>
            {loading && <div>Loading...</div>}
            {!loading && error && <div style={{ color: 'red' }}>{error}</div>}

            {!loading && !error && activeTab === 'mine' && (
              <div>
                {filterAndSort(pastes).length === 0 ? <div>No pastes found.</div> : filterAndSort(pastes).map(renderPasteCard)}
              </div>
            )}

            {!loading && !error && activeTab === 'bookmarks' && (
              <div>
                {filterAndSort(bookmarkedPastes).length === 0 ? <div>No Favourites found.</div> : filterAndSort(bookmarkedPastes).map(renderPasteCard)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../../components/NavBar/NavBar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function ShareAlbum() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState(null);
  const [albumBookmarked, setAlbumBookmarked] = useState(false);
  const [albumBookmarkCount, setAlbumBookmarkCount] = useState(0);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Lấy token từ localStorage khi mount
    const savedToken = localStorage.getItem("token");
    const savedUserId = localStorage.getItem("userId");
    if (savedToken) setToken(savedToken);
    if (savedUserId) setUserId(savedUserId);
  }, []);

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${BACKEND_URL.replace(/\/$/, "")}/share/album/${encodeURIComponent(slug)}`;
        const res = await axios.get(url, {
          headers: token ? { Authorization: "Bearer " + token } : {},
        });
        const alb = res.data.album || null;
        setAlbum(alb);
        setAlbumBookmarkCount(alb?.bookmarkCount || 0);
        // check whether current user bookmarked this album
        try {
          const tokenLocal = localStorage.getItem('token');
          if (tokenLocal && alb?._id) {
            const chk = await axios.get(`${BACKEND_URL.replace(/\/$/, '')}/api/bookmarks/check`, { params: { targetType: 'album', targetId: alb._id }, headers: { Authorization: 'Bearer ' + tokenLocal } });
            setAlbumBookmarked(!!chk.data?.bookmarked);
          } else {
            setAlbumBookmarked(false);
          }
        } catch (e) {
          // ignore
          setAlbumBookmarked(false);
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [slug, token]);

  const isAuthor = album && userId && String(album.authorId) === String(userId);
  window.console.log(album);

  return (
    <>
      <NavBar></NavBar>
    
      <div style={{ minHeight: "100vh", background: "#f6f8fa", padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {loading && <p>Loading album...</p>}
          {!loading && error && !album && <div style={{ color: "#e74c3c" }}>Error: {String(error)}</div>}
          {!loading && album && (
            <div>
              <h1 style={{ marginBottom: 6 }}>{album.name}</h1>
              <div style={{ color: "#666", marginBottom: 12 }}>{album.description}</div>
              <div style={{ display: 'flex', gap: 12, color: '#666', marginBottom: 12 }}>
                {/* Tính tổng view */}
                <div>
                  Views: {(album.images || []).reduce((sum, img) => sum + (img.view || img.views || 0), 0)}
                </div>

                <div>|</div>

                {/* Tính last modified = createdAt mới nhất trong danh sách ảnh */}
                <div>
                  Last modified: {
                    (() => {
                      const imgs = album.images || [];
                      if (!imgs.length) return "N/A";
                      const last = imgs.reduce((latest, img) => {
                        const time = new Date(img.createdAt);
                        return time > latest ? time : latest;
                      }, new Date(0));
                      return last.toLocaleString();
                    })()
                  }
                </div>

              </div>
              <div style={{ marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div><strong>Visibility:</strong> {album.exposure}</div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={async () => {
                      try {
                        const tokenLocal = localStorage.getItem('token');
                        const res = await axios.post(`${BACKEND_URL.replace(/\/$/, '')}/api/bookmarks/toggle`, { targetType: 'album', targetId: album._id }, { headers: tokenLocal ? { Authorization: 'Bearer ' + tokenLocal } : {} });
                        setAlbumBookmarked(res.data.bookmarked);
                        setAlbumBookmarkCount(res.data.count || 0);
                      } catch (err) {
                        if (err.response?.status === 401) return alert('Please sign in to bookmark');
                        console.error(err);
                        alert('Failed to toggle bookmark');
                      }
                    }}
                    style={{ padding: '8px 12px', background: albumBookmarked ? '#ffb6c1' : '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  >
                    {albumBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <div style={{ color: '#666', display: 'none' }}>{albumBookmarkCount} bookmark{albumBookmarkCount !== 1 ? 's' : ''}</div>
                  {isAuthor && (
                    <button
                      onClick={() => navigate(`/edit/album/${album._id}`)}
                      style={{ padding: '8px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginLeft: 12 }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {(album.images || []).map(img => (
                  <div key={img._id} style={{ background: "white", borderRadius: 8, padding: 8, textAlign: "center" }}>
                    <Link to={`/i/image/${img.slug}`}>
                      <img src={img.imageUrl} alt={img.caption || ""} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 6 }} />
                    </Link>
                    <div style={{ marginTop: 8, color: "#444" }}>{img.caption || img.slug}</div>
                    <div style={{ marginTop: 6, color: '#666' }}>{img.bookmarkCount || 0} bookmark{(img.bookmarkCount || 0) !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

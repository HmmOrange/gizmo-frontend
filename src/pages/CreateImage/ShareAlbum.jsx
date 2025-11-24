import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../../components/NavBar/NavBar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function ShareAlbum() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${BACKEND_URL.replace(/\/$/, "")}/share/album/${encodeURIComponent(slug)}`;
        const res = await axios.get(url);
        setAlbum(res.data.album || null);
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [slug]);

  return (
    <>
      <NavBar></NavBar>
    
      <div style={{ minHeight: "100vh", background: "#f6f8fa", padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {loading && <p>Loading album...</p>}
          {!loading && error && <div style={{ color: "#e74c3c" }}>Error: {String(error)}</div>}
          {!loading && album && (
            <div>
              <h1 style={{ marginBottom: 6 }}>{album.name}</h1>
              <div style={{ color: "#666", marginBottom: 12 }}>{album.description}</div>
              <div style={{ marginBottom: 18 }}><strong>Visibility:</strong> {album.exposure}</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {(album.images || []).map(img => (
                  <div key={img._id} style={{ background: "white", borderRadius: 8, padding: 8, textAlign: "center" }}>
                    <Link to={`/share/image/${img.slug}`}>
                      <img src={img.imageUrl} alt={img.caption || ""} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 6 }} />
                    </Link>
                    <div style={{ marginTop: 8, color: "#444" }}>{img.caption || img.slug}</div>
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

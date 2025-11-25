// src/pages/ShareImage.jsx
import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import NavBar from "../../components/NavBar/NavBar";
import { QRCodeCanvas } from "qrcode.react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function ShareImage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [token, setToken] = useState(null);

  const qrRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  const fetchImage = async (pw = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${BACKEND_URL.replace(/\/$/, "")}/share/image/${encodeURIComponent(slug)}`;
      const res = await axios.get(url, { params: pw ? { password: pw } : {}, headers: token ? { Authorization: "Bearer " + token } : {} });
      if (res.data && res.data.requirePassword) {
        setNeedsPassword(true);
        setImage(null);
      } else {
        setImage(res.data.image || null);
        setBookmarked(!!res.data.image?.bookmarked);
        setBookmarkCount(res.data.image?.bookmarkCount || 0);
        setNeedsPassword(false);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (err.response?.data?.requirePassword || (status === 401 && String(msg).toLowerCase().includes("password"))) {
        setNeedsPassword(true);
        setImage(null);
      } else if (status === 403) setError("You do not have permission to view this image");
      else if (status === 404) setError("Image not found");
      else setError("Error loading image: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImage(); }, [slug, token]);

  const downloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `image_${slug}_qr.png`;
    link.click();
  };

  const copyQR = async () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        alert("QR code copied to clipboard!");
      } catch (err) {
        console.error(err);
        alert("Failed to copy QR code");
      }
    });
  };

  return (
    <>
      <NavBar />
      <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ marginBottom: 20 }}>Shared Image</h1>

        {loading && <p>Loading...</p>}
        {!loading && error && !image && <div style={{ color: "#e74c3c", marginBottom: 12 }}>{error}</div>}

        {!loading && needsPassword && (
          <div style={{ marginBottom: 12, textAlign: "center" }}>
            <p>This image is password protected. Please enter the password to view.</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 8, width: 240 }} />
            <div style={{ marginTop: 8 }}>
              <button onClick={() => fetchImage(password)} style={{ padding: "8px 12px" }}>Submit</button>
            </div>
          </div>
        )}

        {!loading && image && (
          <div style={{ textAlign: "center" }}>
            <img src={image.imageUrl} alt={image.caption || "Shared image"} style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }} />
            <p style={{ marginTop: 12, color: "#666" }}>{image.caption}</p>
            <p style={{ marginTop: 6, color: "#666" }}>Link: {window.location.href}</p>
            <div style={{ marginTop: 8, color: '#666' }}>
              <span style={{ marginRight: 12 }}>Views: {image.views ?? 0}</span>
              <span>Last modified: {new Date(image.updatedAt || image.updated_at || image.createdAt).toLocaleString()}</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
              <button onClick={async () => {
                try {
                  const tokenLocal = localStorage.getItem('token');
                  const res = await axios.post(`${BACKEND_URL.replace(/\/$/, '')}/api/bookmarks/toggle`, { targetType: 'image', targetId: image._id }, { headers: tokenLocal ? { Authorization: 'Bearer ' + tokenLocal } : {} });
                  setBookmarked(res.data.bookmarked);
                  setBookmarkCount(res.data.count || 0);
                } catch (err) {
                  if (err.response?.status === 401) return alert('Please sign in to bookmark');
                  console.error(err);
                  alert('Failed to toggle bookmark');
                }
              }} style={{ padding: '8px 12px', background: bookmarked ? '#ffb6c1' : '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <div style={{ color: '#666', display: 'none' }}>{bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''}</div>
            </div>

            {/* QR Code */}
            <div style={{ marginTop: 20, textAlign: "center" }} ref={qrRef}>
              <p>Scan QR code to open this image:</p>
              <QRCodeCanvas value={window.location.href} size={150} />
              <div style={{ marginTop: 8 }}>
                <button onClick={downloadQR} style={{ marginRight: 8 }}>Download QR</button>
                <button onClick={copyQR}>Copy QR</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

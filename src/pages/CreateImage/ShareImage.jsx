// src/pages/ShareImage.jsx   (hoặc src/components/ShareImage.jsx)

import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../../components/NavBar/NavBar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function ShareImage() {
  const { slug } = useParams(); // use slug-only route: /share/image/:slug
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  const fetchImage = async (pw = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${BACKEND_URL.replace(/\/$/, "")}/share/image/${encodeURIComponent(slug)}`;
      const res = await axios.get(url, { params: pw ? { password: pw } : {} });
      setImage(res.data.image || null);
      setNeedsPassword(false);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (status === 401 && String(msg).toLowerCase().includes("password")) {
        setNeedsPassword(true);
      } else if (status === 403) {
        setError("Bạn không có quyền xem ảnh này");
      } else if (status === 404) {
        setError("Không tìm thấy ảnh");
      } else {
        setError("Lỗi khi tải ảnh: " + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <>
      <NavBar />
      <div style={{ 
        minHeight: "100vh", 
        background: "#f0f2f5", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        padding: "40px 20px",
        fontFamily: "system-ui, sans-serif"
      }}>
        <h1 style={{ marginBottom: 20 }}>Shared Image</h1>

        {loading && <p>Loading...</p>}

        {!loading && error && (
          <div style={{ color: "#e74c3c", marginBottom: 12 }}>{error}</div>
        )}

        {!loading && needsPassword && (
          <div style={{ marginBottom: 12, textAlign: "center" }}>
            <p>Ảnh được bảo vệ bằng mật khẩu. Vui lòng nhập mật khẩu để xem.</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 8, width: 240 }} />
            <div style={{ marginTop: 8 }}>
              <button onClick={() => fetchImage(password)} style={{ padding: "8px 12px" }}>Submit</button>
            </div>
          </div>
        )}

        {!loading && image && (
          <div style={{ textAlign: "center" }}>
            <img
              src={image.imageUrl}
              alt={image.caption || "Shared image"}
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
            />
            <p style={{ marginTop: 12, color: "#666" }}>{image.caption}</p>
            <p style={{ marginTop: 6, color: "#666" }}>Link: {window.location.href}</p>
          </div>
        )}
      </div>
    </>
  );
}
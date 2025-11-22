// src/pages/ShareImage.jsx   (hoặc src/components/ShareImage.jsx)
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function ShareImage() {
  const { slug } = useParams(); // lấy slug từ URL: /share/:slug
  const [loading, setLoading] = useState(true);

  // URL ảnh trực tiếp từ S3 (không cần backend trung gian)
  const imageUrl = `https://gizmo-images-bucket.s3.ap-southeast-1.amazonaws.com/images/${slug}.png`;
  // → thay gizmo-draw-2025 bằng tên bucket thật của bạn

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f0f2f5", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      padding: "40px 20px",
      fontFamily: "system-ui, sans-serif"
    }}>
      <h1 style={{ marginBottom: 20 }}>Shared Drawing</h1>
      
      {loading && <p>Loading image...</p>}

      <img
        src={imageUrl}
        alt="Shared drawing"
        style={{
          maxWidth: "100%",
          maxHeight: "80vh",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          alert("Không tìm thấy ảnh hoặc link đã hết hạn");
        }}
      />

      <p style={{ marginTop: 20, color: "#666" }}>
        Link: {window.location.href}
      </p>
    </div>
  );
}
// components/CreateImage.jsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const CreateImage = ({ onClose }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);

  const [albumTitle, setAlbumTitle] = useState("");
  const [albumSlug, setAlbumSlug] = useState("");

  const [images, setImages] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const MAX_WIDTH = 900;
  const MAX_HEIGHT = 700;

  useEffect(() => {
    if (!canvasRef.current || selectedIdx === null) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [selectedIdx]);

  useEffect(() => {
    if (ctxRef.current && selectedIdx !== null) {
      const img = images[selectedIdx];
      ctxRef.current.strokeStyle = img.tool === "eraser" ? "#ffffff" : img.color;
      ctxRef.current.lineWidth = img.size;
    }
  }, [images, selectedIdx]);

  const saveState = useCallback(() => {
    if (selectedIdx === null || !canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL();

    setImages(prev => {
      const updated = [...prev];
      const img = updated[selectedIdx];
      const newHistory = img.canvasState.slice(0, img.historyStep + 1);
      newHistory.push(dataURL);
      if (newHistory.length > 50) newHistory.shift();

      img.canvasState = newHistory;
      img.historyStep = newHistory.length - 1;
      return updated;
    });
  }, [selectedIdx]);

  const loadCurrentImage = () => {
    if (selectedIdx === null) return;
    const imgData = images[selectedIdx];
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const ratio = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height, 1);
      const w = img.width * ratio;
      const h = img.height * ratio;

      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      if (imgData.canvasState.length > 0) {
        const lastState = imgData.canvasState[imgData.historyStep];
        if (lastState) {
          const overlay = new Image();
          overlay.onload = () => ctx.drawImage(overlay, 0, 0, w, h);
          overlay.src = lastState;
        }
      }
    };
    img.src = imgData.preview;
  };

  useEffect(() => {
    if (selectedIdx !== null) loadCurrentImage();
  }, [selectedIdx]);

  const undo = () => {
    if (selectedIdx === null) return;
    const img = images[selectedIdx];
    if (img.historyStep <= 0) return;
    setImages(prev => {
      const updated = [...prev];
      updated[selectedIdx].historyStep -= 1;
      return updated;
    });
  };

  const redo = () => {
    if (selectedIdx === null) return;
    const img = images[selectedIdx];
    if (img.historyStep >= img.canvasState.length - 1) return;
    setImages(prev => {
      const updated = [...prev];
      updated[selectedIdx].historyStep += 1;
      return updated;
    });
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      slug: "",
      canvasState: [],
      historyStep: -1,
      tool: "pen",
      color: "#000000",
      size: 5,
    }));

    setImages(prev => [...prev, ...newImages]);
    if (selectedIdx === null && newImages.length > 0) {
      setSelectedIdx(0);
    }
  };

  const selectImage = (idx) => {
    if (selectedIdx !== null) saveState();
    setSelectedIdx(idx);
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    if (selectedIdx === idx) {
      setSelectedIdx(images.length <= 1 ? null : 0);
    } else if (selectedIdx > idx) {
      setSelectedIdx(selectedIdx - 1);
    }
  };

  const updateImageProp = (prop, value) => {
    if (selectedIdx === null) return;
    setImages(prev => {
      const updated = [...prev];
      updated[selectedIdx][prop] = value;
      return updated;
    });
  };

  const start = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x * scaleX, y * scaleY);
    isDrawing.current = true;
    saveState();
  };

  const draw = (e) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    ctxRef.current.lineTo(x * scaleX, y * scaleY);
    ctxRef.current.stroke();
  };

  const stop = () => {
    if (isDrawing.current) isDrawing.current = false;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveState();
  };

  const handleCreateAlbum = async () => {
    if (images.length === 0) return alert("Please upload at least one image!");
    if (selectedIdx !== null) saveState();

    setIsUploading(true);

    try {
      const albumId = albumSlug.trim() || `album-${Date.now()}`;
      const uploadedImages = [];

      for (let i = 0; i < images.length; i++) {
        const imgData = images[i];

        if (selectedIdx === i) saveState();
        else {
          setSelectedIdx(i);
          await new Promise(resolve => setTimeout(resolve, 50));
          saveState();
        }

        const canvas = canvasRef.current;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95));

        const finalSlug = imgData.slug.trim() || `image-${i + 1}`;

        const formData = new FormData();
        formData.append("image", blob, `${finalSlug}.png`);
        formData.append("slug", finalSlug);
        formData.append("albumId", albumId);
        formData.append("albumTitle", albumTitle || "My Album");

        const res = await axios.post(`${BACKEND_URL}/api/images`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        uploadedImages.push(res.data.imageUrl);
      }

      const albumLink = `https://gizmo.app/album/${albumId}`;
      setShareLink(albumLink);
      alert(`Album created successfully!\nLink: ${albumLink}\n${images.length} images uploaded!`);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err.response?.data?.message || err.message || "Please check server console"));
    } finally {
      setIsUploading(false);
    }
  };

  const currentImage = selectedIdx !== null ? images[selectedIdx] : null;

  return (
    <div style={{ display: "flex", gap: 24, padding: 20, background: "#f5f7fa", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: 380, background: "white", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", padding: 20 }}>
        <h2>Create Album</h2>

        <input
          type="text"
          placeholder="Album title (optional)"
          value={albumTitle}
          onChange={e => setAlbumTitle(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          type="text"
          placeholder="Album URL (optional)"
          value={albumSlug}
          onChange={e => setAlbumSlug(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <label style={{ display: "block", background: "#3498db", color: "white", padding: 14, borderRadius: 8, textAlign: "center", cursor: "pointer", fontWeight: "bold" }}>
          Upload Images
          <input type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />
        </label>

        {images.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h4>Images ({images.length})</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {images.map((img, i) => (
                <div key={i} onClick={() => selectImage(i)} style={{ position: "relative", border: selectedIdx === i ? "4px solid #3498db" : "2px solid #eee", borderRadius: 8, overflow: "hidden", cursor: "pointer" }}>
                  <img src={img.preview} alt="" style={{ width: "100%", height: 100, objectFit: "cover" }} />
                  <button onClick={e => { e.stopPropagation(); removeImage(i); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", borderRadius: "50%", width: 24, height: 24, border: "none" }}>×</button>
                  {selectedIdx === i && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(52,152,219,0.9)", color: "white", padding: 4, fontSize: 12, textAlign: "center" }}>EDITING</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleCreateAlbum}
          disabled={isUploading || images.length === 0}
          style={{ marginTop: 24, width: "100%", padding: 16, background: isUploading ? "#95a5a6" : "#27ae60", color: "white", border: "none", borderRadius: 10, fontSize: 18, fontWeight: "bold" }}
        >
          {isUploading ? "Uploading Album..." : "Create Album & Share"}
        </button>

        {shareLink && (
          <div style={{ marginTop: 16, padding: 16, background: "#d4edda", borderRadius: 10, textAlign: "center", fontWeight: "bold" }}>
            Album ready!<br />
            <a href={shareLink} target="_blank" rel="noopener noreferrer" style={{ color: "#27ae60" }}>{shareLink}</a>
          </div>
        )}
      </div>

      <div style={{ flex: 1, background: "white", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", padding: 20 }}>
        <h2>Edit Image</h2>

        {currentImage && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: "bold" }}>Custom URL for this image</label>
            <input
              type="text"
              placeholder="my-cool-drawing"
              value={currentImage.slug}
              onChange={e => updateImageProp("slug", e.target.value)}
              style={{ width: "100%", padding: 12, marginTop: 6, borderRadius: 8, border: "1px solid #ddd" }}
            />
            <small>Link: gizmo.app/i/{currentImage.slug || "..."}</small>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
          <button onClick={() => updateImageProp("tool", "pen")} style={{ fontWeight: currentImage?.tool === "pen" ? "bold" : "normal" }}>Pen</button>
          <button onClick={() => updateImageProp("tool", "eraser")} style={{ fontWeight: currentImage?.tool === "eraser" ? "bold" : "normal" }}>Eraser</button>
          <input type="color" value={currentImage?.color || "#000000"} onChange={e => updateImageProp("color", e.target.value)} disabled={currentImage?.tool === "eraser"} />
          <input type="range" min="1" max="50" value={currentImage?.size || 5} onChange={e => updateImageProp("size", +e.target.value)} style={{ width: 140 }} />
          <span>{currentImage?.size || 5}px</span>
          <button onClick={undo} disabled={!currentImage || currentImage.historyStep <= 0}>Undo</button>
          <button onClick={redo} disabled={!currentImage || currentImage.historyStep >= currentImage.canvasState.length - 1}>Redo</button>
          <button onClick={clearCanvas} style={{ background: "#e74c3c", color: "white" }}>Clear</button>
        </div>

        <div style={{ textAlign: "center", background: "#fafafa", borderRadius: 12, padding: 40, minHeight: 600 }}>
          {selectedIdx === null ? (
            <p style={{ color: "#888", fontSize: 20 }}>Upload and select an image to edit</p>
          ) : (
            <canvas
              ref={canvasRef}
              style={{ border: "2px solid #ddd", borderRadius: 8, maxWidth: "100%", cursor: "crosshair", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
              onMouseDown={start}
              onMouseMove={draw}
              onMouseUp={stop}
              onMouseLeave={stop}
              onTouchStart={start}
              onTouchMove={draw}
              onTouchEnd={stop}
            />
          )}
        </div>
      </div>

      {onClose && <button onClick={onClose} style={{ position: "fixed", top: 20, right: 20, padding: "12px 24px", background: "#34495e", color: "white", borderRadius: 8 }}>Close</button>}
    </div>
  );
};

export default CreateImage;
import React, { useRef, useEffect, useState, useCallback } from "react";
import axios from "axios";
import NavBar from "../../components/NavBar/NavBar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const CreateImage = ({ onClose }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);

  const [albumTitle, setAlbumTitle] = useState("");
  const [albumSlug, setAlbumSlug] = useState("");
  const [albumExposure, setAlbumExposure] = useState("private");
  const [addToAlbum, setAddToAlbum] = useState(false);
  const [availableImageSlug, setAvailableImageSlug] = useState(null);
  const [availableAlbumSlug, setAvailableAlbumSlug] = useState(null);
  const [albumsList, setAlbumsList] = useState([]);
  const [showAlbumChooser, setShowAlbumChooser] = useState(false);

  const [images, setImages] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareLinks, setShareLinks] = useState([]);

  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const MAX_WIDTH = 900;
  const MAX_HEIGHT = 700;

  const FRONTEND_URL = window.location.origin;

  useEffect(() => {
    if (!canvasRef.current || selectedIdx === null) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [selectedIdx]);

  // Draw uploaded image onto canvas when selectedIdx or images changes
  useEffect(() => {
    if (!canvasRef.current || selectedIdx === null) return;
    const imgData = images[selectedIdx];
    if (!imgData || !imgData.preview) return;
    // Only draw if this is the first time (no history yet)
    if (imgData.canvasState.length > 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = new window.Image();
    image.onload = () => {
      // Resize canvas to fit image, but constrain to MAX_WIDTH/HEIGHT
      let w = image.width;
      let h = image.height;
      const aspect = w / h;
      if (w > MAX_WIDTH) {
        w = MAX_WIDTH;
        h = Math.round(w / aspect);
      }
      if (h > MAX_HEIGHT) {
        h = MAX_HEIGHT;
        w = Math.round(h * aspect);
      }
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(image, 0, 0, w, h);
      // Save initial state
      const dataURL = canvas.toDataURL();
      setImages(prev => {
        const updated = [...prev];
        updated[selectedIdx] = {
          ...updated[selectedIdx],
          canvasState: [dataURL],
          historyStep: 0,
        };
        return updated;
      });
    };
    image.src = imgData.preview;
    // eslint-disable-next-line
  }, [selectedIdx, images]);

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

  // fetch existing albums for chooser
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/albums`);
        setAlbumsList(res.data.albums || []);
      } catch (err) {
        // ignore
      }
    };
    fetchAlbums();
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        console.log("JWT payload:", payload); 
        setUserId(payload.user_id || null);
      } catch (err) {
        setUserId(null);
      }
    }
  }, []);

  // debounce helpers
  const debounce = (fn, wait = 400) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  // slug-checking removed: no backend validation for slugs
  const checkImageSlug = debounce(async (slug) => {
    const s = (slug || "").trim();
    if (!s) {
      setAvailableImageSlug(null);
      return;
    }
    try {
      const res = await axios.get(`${BACKEND_URL}/api/images/check-slug`, { params: { slug: s } });
      setAvailableImageSlug(res.data.available === true);
    } catch (err) {
      setAvailableImageSlug(null);
    }
  }, 400);

  const checkAlbumSlug = debounce(async (slug) => {
    const s = (slug || "").trim();
    if (!s) {
      setAvailableAlbumSlug(null);
      return;
    }
    try {
      const res = await axios.get(`${BACKEND_URL}/api/albums/check-slug`, { params: { slug: s } });
      setAvailableAlbumSlug(res.data.available === true);
    } catch (err) {
      setAvailableAlbumSlug(null);
    }
  }, 400);

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
      slugEdited: false,
      exposure: "public",
      password: "",
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
      if (prop === "slug") updated[selectedIdx].slugEdited = true;
      return updated;
    });
    if (prop === "slug") {
      checkImageSlug(value);
    }
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
      // Decide where to upload: if user chose to add into album, require album fields
      let albumId;
      let finalAlbumTitle;

      if (addToAlbum) {
        if (!albumTitle.trim() || !albumSlug.trim()) {
          return alert("Please provide both Album title and Album URL when adding into album.");
        }
        albumId = albumSlug.trim();
        finalAlbumTitle = albumTitle.trim();
      } else {
        // default global images album
        albumId = "images";
        finalAlbumTitle = "Images";
      }

      // Prepare slugs for all images in this batch
      const initialSlugs = images.map((imgData, i) => {
        const fileBase = (imgData.name || "").replace(/\.[^/.]+$/, "");
        const sanitizedFileBase = fileBase.trim().replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
        return (imgData.slug.trim() || sanitizedFileBase || `img-${Date.now()}`).trim();
      });

      // Ensure unique within this batch by appending -1, -2 for duplicates
      const counts = {};
      const batchUnique = initialSlugs.map((s) => {
        const base = s;
        counts[base] = (counts[base] || 0) + 1;
        if (counts[base] === 1) return base;
        return `${base}-${counts[base] - 1}`;
      });

      // No server-side slug checking: use unique slugs within the batch
      const finalSlugs = batchUnique;

      // Bulk-check final slugs against server to avoid conflicts
      try {
        const bulk = await axios.post(`${BACKEND_URL}/api/images/check-slugs-bulk`, { slugs: finalSlugs });
        const results = bulk.data.results || {};
        const taken = finalSlugs.filter(s => results[s] === false);
        if (taken.length) {
          alert(`The following slugs are already taken: ${taken.join(", ")}. Please change them and try again.`);
          setIsUploading(false);
          return;
        }
      } catch (err) {
        // If bulk check fails, stop to avoid accidental overwrites
        console.error("Slug bulk-check failed:", err);
        alert("Failed to validate image slugs. Please try again later.");
        setIsUploading(false);
        return;
      }

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

        const finalSlug = finalSlugs[i];

        const formData = new FormData();
        formData.append("image", blob, `${finalSlug}.png`);
        formData.append("slug", finalSlug);
        formData.append("albumId", albumId);
        formData.append("albumTitle", finalAlbumTitle);
        // include album exposure when creating/selecting album
        if (addToAlbum) formData.append("albumExposure", albumExposure);
        // include image exposure and password when set
        const exposureToUse = addToAlbum ? albumExposure : (imgData.exposure || "public");
        formData.append("exposure", exposureToUse);
        if (!addToAlbum && imgData.exposure === "password_protected") {
          formData.append("password", imgData.password || "");
        }
        // indicate whether this slug was explicitly edited by the user
        formData.append("isCustomSlug", imgData.slugEdited ? "true" : "false");

        let res;
        try {
          res = await axios.post(
            `${BACKEND_URL}/api/images`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                // Thêm Authorization nếu có token
                ...(token ? { Authorization: "Bearer " + token } : {})
              }
            }
          );
        } catch (err) {
          if (err.response?.status === 409) {
            alert(`Upload failed: slug \"${finalSlug}\" is already taken. Please change the slug and try again.`);
            setIsUploading(false);
            return;
          }
          throw err;
        }

        uploadedImages.push(res.data.imageUrl);
        // build share link cho image sử dụng FRONTEND_URL
        const imgSlug = res.data?.image?.slug || finalSlugs[i];
        const link = `${FRONTEND_URL}/share/image/${imgSlug}`;
        uploadedImages[uploadedImages.length - 1] = { url: res.data.imageUrl, link, slug: imgSlug };
      }

      // Show per-image share links (do not show album link when adding into album)
      const links = uploadedImages.map(i => i.link || i);
      setShareLinks(links);
      if (addToAlbum) {
        alert(`Images uploaded into album \n${images.length} images uploaded!`);
      } else {
        alert(`Images uploaded\n${images.length} images uploaded!`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err.response?.data?.message || err.message || "Please check server console"));
    } finally {
      setIsUploading(false);
    }
  };

  const currentImage = selectedIdx !== null ? images[selectedIdx] : null;

  // Filter albums for chooser: only show public, or private/unlisted if user is author
  const allowedAlbums = albumsList.filter(a => {
    console.log(userId); // Use a._id or a.slug for debugging, not a.albumId
    if (a.exposure === "public") return true;
    if ((a.exposure === "private" || a.exposure === "unlisted") && userId && a.authorId === userId) return true;
    return false;
  });

  return (
    <>
      <NavBar token={token} setToken={setToken} />
    
      <div style={{ display: "flex", gap: 24, padding: 20, background: "#f5f7fa", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ width: 380, background: "white", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", padding: 20 }}>
          <h2>Create Album</h2>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={addToAlbum} onChange={e => setAddToAlbum(e.target.checked)} />
              <span style={{ fontWeight: "bold" }}>Add into album</span>
            </label>
            <button type="button" onClick={() => setShowAlbumChooser(s => !s)} style={{ padding: "6px 10px" }}>{showAlbumChooser ? "Hide" : "Choose existing"}</button>
          </div>

          {addToAlbum ? (
            <>
              {showAlbumChooser ? (
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: "bold" }}>Select existing album</label>
                  <select style={{ width: "100%", padding: 10, marginTop: 6 }} onChange={e => {
                    const v = e.target.value;
                    if (!v) {
                      setAlbumSlug("");
                      setAlbumTitle("");
                      setAvailableAlbumSlug(null);
                      return;
                    }
                    // Only allow selection if album is allowed
                    const sel = allowedAlbums.find(a => a.slug === v);
                    if (sel) {
                      setAlbumSlug(sel.slug);
                      setAlbumTitle(sel.name);
                      setAlbumExposure(sel.exposure || "private");
                      setAvailableAlbumSlug(true);
                    }
                  }} value={albumSlug || ""}>
                    <option value="">-- choose an album --</option>
                    {allowedAlbums.map(a => (
                      <option key={a._id} value={a.slug}>{a.name} ({a.slug})</option>
                    ))}
                  </select>

                  {albumSlug ? (
                    <div style={{ marginTop: 8, padding: 8, background: "#fafafa", borderRadius: 8 }}>
                      <div style={{ fontWeight: "bold" }}>{albumTitle}</div>
                      <div style={{ color: "#666", fontSize: 13 }}>Visibility: {albumExposure}</div>
                      {/* Nút Link to album */}
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={`${window.location.origin}/share/album/${encodeURIComponent(albumSlug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-block", padding: "6px 12px", background: "#3498db", color: "white", borderRadius: 6, textDecoration: "none", marginRight: 8 }}
                        >
                          Link to album
                        </a>
                        <button onClick={() => { setShowAlbumChooser(false); setAlbumSlug(""); setAlbumTitle(""); setAvailableAlbumSlug(null); }} style={{ padding: "6px 10px" }}>Use new album instead</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>No album selected — pick an existing album or toggle to create a new one.</div>
                  )}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Album title"
                    value={albumTitle}
                    onChange={e => setAlbumTitle(e.target.value)}
                    style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 8, border: "1px solid #ddd" }}
                  />

                  <input
                    type="text"
                    placeholder="Album slug"
                    value={albumSlug}
                    onChange={e => { setAlbumSlug(e.target.value); checkAlbumSlug(e.target.value); }}
                    style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 8, border: "1px solid #ddd" }}
                  />
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>Album access</label>
                    <select value={albumExposure} onChange={e => setAlbumExposure(e.target.value)} style={{ width: "100%", padding: 10 }}>
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  {availableAlbumSlug === false && <div style={{ color: "#e74c3c", marginTop: 6 }}>This album URL is already taken — you can select it from existing albums.</div>}

                  {albumsList.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: 14, fontWeight: "bold" }}>Or select existing album</label>
                      <div>
                        <button type="button" onClick={() => setShowAlbumChooser(true)} style={{ padding: "6px 10px", marginTop: 6 }}>Choose existing</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={{ marginBottom: 16, color: "#666", fontSize: 14 }}>Images will be uploaded into the global <strong>images</strong> album by default.</div>
          )}

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
            {isUploading ? "Uploading..." : "Upload"}
          </button>

          {shareLinks.length > 0 && (
            <div style={{ marginTop: 16, padding: 16, background: "#d4edda", borderRadius: 10 }}>
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>{addToAlbum ? "Images uploaded" : "Images uploaded"}</div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {shareLinks.map((l, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    <a href={l} target="_blank" rel="noopener noreferrer">{l}</a>
                  </li>
                ))}
              </ul>
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
                onChange={e => { updateImageProp("slug", e.target.value); }}
                style={{ width: "100%", padding: 12, marginTop: 6, borderRadius: 8, border: "1px solid #ddd" }}
              />
              <small>Link: gizmo.app/i/{currentImage.slug || "..."}</small>
              {availableImageSlug === false && <div style={{ color: "#e74c3c", marginTop: 6 }}>This image URL is already taken.</div>}
              <div style={{ marginTop: 8 }}>
                {/* Nếu addToAlbum, chỉ hiển thị thông báo, không cho chọn exposure/password */}
                {addToAlbum ? (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Image access will follow album access.</div>
                ) : (
                  <>
                    <label style={{ fontWeight: "bold", display: "block", marginTop: 8 }}>Image access</label>
                    <select value={currentImage.exposure} onChange={e => updateImageProp("exposure", e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }}>
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                      <option value="password_protected">Password protected</option>
                    </select>
                    {currentImage.exposure === "password_protected" && (
                      <input
                        type="text"
                        placeholder="Password to view this image"
                        value={currentImage.password || ""}
                        onChange={e => updateImageProp("password", e.target.value)}
                        style={{ width: "100%", padding: 12, marginTop: 6, borderRadius: 8, border: "1px solid #ddd" }}
                      />
                    )}
                  </>
                )}
              </div>
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
    </>
    );
};

export default CreateImage;
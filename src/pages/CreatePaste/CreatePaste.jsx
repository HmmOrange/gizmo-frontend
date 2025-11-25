import { useState, useEffect } from "react";
import NavBar from "../../components/NavBar/NavBar";
import { marked } from "marked";
import DOMPurify from "dompurify";
import './CreatePaste.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function CreatePaste() {
  const API_BASE = `${BACKEND_URL}/paste`;

  const [form, setForm] = useState({
    title: "",
    content: "",
    date_of_expiry: "",
    password: "",
    slug: "",
    exposure: "public",
  });

  const [createResult, setCreateResult] = useState(null);
  const [allPastes, setAllPastes] = useState([]);
  const [fetchId, setFetchId] = useState("");
  const [fetchResult, setFetchResult] = useState(null);
  const [token, setToken] = useState(null);

  const [previewMode, setPreviewMode] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePreview = () => {
    const dirty = marked.parse(form.content || "");
    const render = DOMPurify.sanitize(dirty);
    setPreviewHTML(render);
    setPreviewMode(true);
  };

  const closePreview = () => setPreviewMode(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const convertExposure =
      form.exposure === "password"
        ? "password_protected"
        : form.exposure;

    const payload = {
      title: form.title,
      content: form.content,
      exposure: convertExposure,
    };

    if (form.date_of_expiry) payload.expiredAt = form.date_of_expiry;
    if (form.slug) payload.slug = form.slug;

    if (convertExposure === "password_protected" && form.password) {
      payload.password = form.password;
    }

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        setCreateResult(`${FRONTEND_URL}/share/${json.slug}`);
      } else {
        setCreateResult({ error: json.message || json.error });
      }
    } catch (err) {
      setCreateResult({ error: err.message });
    }
  };

  const loadAll = async () => {
    try {
      const res = await fetch(API_BASE);
      const json = await res.json();
      setAllPastes(Array.isArray(json) ? json : json.pastes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaste = async () => {
    if (!fetchId.trim()) {
      setFetchResult({ error: "Paste ID required." });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(fetchId)}`);
      const json = await res.json();
      setFetchResult(json);
    } catch (err) {
      setFetchResult({ error: err.message });
    }
  };

  return (
    <>
      <NavBar token={token} setToken={setToken} />
      <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "900px", margin: "2em auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1em" }}>Create a Paste</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.8em" }}>
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter title"
            style={{ padding: "8px", fontSize: "16px", borderRadius: "4px", border: "1px solid #ccc" }}
          />

          <label>Content (Markdown)</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Write your markdown content..."
            style={{
              minHeight: "150px",
              padding: "10px",
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontFamily: "monospace",
            }}
          />

          <div style={{ display: "flex", gap: "1em", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handlePreview}
              style={{ padding: "8px 16px", borderRadius: "4px", border: "none", background: "#007bff", color: "white", cursor: "pointer" }}
            >
              Preview Markdown
            </button>

            <button
              type="submit"
              style={{ padding: "8px 16px", borderRadius: "4px", border: "none", background: "#28a745", color: "white", cursor: "pointer" }}
            >
              Create Paste
            </button>
          </div>

          <label>Exposure</label>
          <select
            name="exposure"
            value={form.exposure}
            onChange={handleChange}
            style={{ padding: "8px", fontSize: "16px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="password">Password Protected</option>
            <option value="private">Private</option>
          </select>

          {form.exposure === "password" && (
            <>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                style={{ padding: "8px", fontSize: "16px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </>
          )}

          <label>Expiry Date (optional)</label>
          <input
            type="datetime-local"
            name="date_of_expiry"
            value={form.date_of_expiry}
            onChange={handleChange}
            style={{ padding: "8px", fontSize: "16px", borderRadius: "4px", border: "1px solid #ccc" }}
          />

          <label>Custom URL (optional)</label>
          <input
            type="text"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="Enter a custom URL"
            style={{ padding: "8px", fontSize: "16px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </form>

        {previewMode && (
          <div
            style={{
              display: "flex",
              gap: "1em",
              marginTop: "1em",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h4>Markdown</h4>
              <pre
                style={{
                  background: "#f7f7f7",
                  padding: "10px",
                  borderRadius: "4px",
                  minHeight: "150px",
                  fontFamily: "monospace",
                  overflowX: "auto",
                }}
              >
                {form.content}
              </pre>
            </div>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h4>Preview</h4>
              <div
                className="markdown-body"
                style={{
                  background: "#fff",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  minHeight: "150px",
                  overflowX: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: previewHTML }}
              />
            </div>
            <button
              onClick={closePreview}
              style={{ marginTop: "10px", padding: "6px 12px", borderRadius: "4px", border: "none", background: "#dc3545", color: "white", cursor: "pointer" }}
            >
              Close Preview
            </button>
          </div>
        )}

        {createResult && (
          <div
            style={{
              marginTop: "1em",
              background: "#f7f7f7",
              padding: "1em",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            {typeof createResult === "string" ? (
              <a href={createResult}>{createResult}</a>
            ) : (
              <pre>{JSON.stringify(createResult, null, 2)}</pre>
            )}
          </div>
        )}

        <hr style={{ margin: "2em 0" }} />

        <h2>All Public Pastes</h2>
        <button
          onClick={loadAll}
          style={{ padding: "8px 16px", borderRadius: "4px", border: "none", background: "#17a2b8", color: "white", cursor: "pointer", marginBottom: "1em" }}
        >
          Load All
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
          {allPastes.length
            ? allPastes.map((p) => (
              <div
                key={p.slug}
                style={{
                  background: "#f7f7f7",
                  padding: "1em",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <b>{p.title || "No Title"}</b>
                <div style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", marginTop: "0.5em" }}>
                  {p.content}
                </div>
                <small>ID: {p.slug}</small>
              </div>
            ))
            : "No pastes found."}
        </div>

        <hr style={{ margin: "2em 0" }} />

        <h2>Fetch Paste by ID</h2>
        <div style={{ display: "flex", gap: "0.5em", flexWrap: "wrap" }}>
          <input
            type="text"
            value={fetchId}
            onChange={(e) => setFetchId(e.target.value)}
            placeholder="Paste ID"
            style={{ padding: "8px", flex: 1, borderRadius: "4px", border: "1px solid #ccc" }}
          />
          <button
            onClick={fetchPaste}
            style={{ padding: "8px 16px", borderRadius: "4px", border: "none", background: "#ffc107", color: "white", cursor: "pointer" }}
          >
            Fetch
          </button>
        </div>

        {fetchResult && (
          <div
            style={{
              marginTop: "1em",
              background: "#f7f7f7",
              padding: "1em",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            {fetchResult.error ? (
              `ERROR: ${fetchResult.error}`
            ) : (
              <pre>{JSON.stringify(fetchResult, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </>
  );
}

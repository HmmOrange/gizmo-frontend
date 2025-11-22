import { useState, useEffect } from "react";
import NavBar from "../../components/NavBar/NavBar";

export default function CreatePaste() {
  const API_BASE = "http://localhost:3000/paste";

  const [form, setForm] = useState({
    title: "",
    content: "",
    date_of_expiry: "",
    password: "",
    slug: "",
    exposure: "public", // mặc định
  });

  const [createResult, setCreateResult] = useState(null);
  const [allPastes, setAllPastes] = useState([]);
  const [fetchId, setFetchId] = useState("");
  const [fetchResult, setFetchResult] = useState(null);

  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // convert FE → BE enum
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

    // chỉ gửi password nếu exposure là password_protected
    if (convertExposure === "password_protected" && form.password) {
      payload.password = form.password;
    }

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;

    const res = await fetch(API_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok) {
      setCreateResult(`http://localhost:5173/share/${json.slug}`);
    } else {
      setCreateResult({ error: json.message || json.error });
    }
  };

  const loadAll = async () => {
    const res = await fetch(API_BASE);
    const json = await res.json();
    setAllPastes(Array.isArray(json) ? json : json.pastes || []);
  };

  const fetchPaste = async () => {
    if (!fetchId.trim()) {
      setFetchResult({ error: "Paste ID required." });
      return;
    }

    const res = await fetch(`${API_BASE}/${encodeURIComponent(fetchId)}`);
    const json = await res.json();
    setFetchResult(json);
  };

  return (
    <>
      <NavBar token={token} setToken={setToken} />
      <div style={{ fontFamily: "Arial", margin: "2em" }}>
        <h2>Create a Paste</h2>
        <form onSubmit={handleSubmit}>

          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
          />

          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            required
            style={{ minHeight: "80px" }}
          />

          {/* Exposure */}
          <label htmlFor="exposure">Exposure</label>
          <select
            id="exposure"
            name="exposure"
            value={form.exposure}
            onChange={handleChange}
          >
            <option value="public">Public (visible in feed)</option>
            <option value="unlisted">Unlisted (no feed/search)</option>
            <option value="password">Password Protected</option>
            <option value="private">Private (only you)</option>
          </select>

          {/* Only show password field when needed */}
          {form.exposure === "password" && (
            <>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </>
          )}

          <label htmlFor="date_of_expiry">Expiry Date (optional)</label>
          <input
            type="datetime-local"
            id="date_of_expiry"
            name="date_of_expiry"
            value={form.date_of_expiry}
            onChange={handleChange}
          />

          <label htmlFor="slug">Custom URL (optional)</label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="Enter a custom URL"
          />

          <button type="submit">Create Paste</button>
        </form>

        {createResult && (
          <div
            style={{
              marginTop: "1em",
              background: "#f7f7f7",
              padding: "1em",
              border: "1px solid #ccc",
            }}
          >
            {typeof createResult === "string" ? (
              <a href={createResult}>{createResult}</a>
            ) : (
              <pre>{JSON.stringify(createResult, null, 2)}</pre>
            )}
          </div>
        )}

        <hr />
        <h2>All Public Pastes</h2>
        <button onClick={loadAll}>Load All</button>
        <div style={{ marginTop: "1em" }}>
          {allPastes.length
            ? allPastes.map((p) => (
              <div
                key={p.slug}
                style={{
                  background: "#f7f7f7",
                  padding: "1em",
                  border: "1px solid #ccc",
                  marginBottom: "1em",
                }}
              >
                <b>{p.title || "No Title"}</b>
                <br />
                {p.content}
                <br />
                <small>ID: {p.slug}</small>
              </div>
            ))
            : "No pastes found."}
        </div>

        <hr />
        <h2>Fetch Paste by ID</h2>
        <input
          type="text"
          value={fetchId}
          onChange={(e) => setFetchId(e.target.value)}
          placeholder="Paste ID"
        />
        <button onClick={fetchPaste}>Fetch</button>

        {fetchResult && (
          <div
            style={{
              marginTop: "1em",
              background: "#f7f7f7",
              padding: "1em",
              border: "1px solid #ccc",
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

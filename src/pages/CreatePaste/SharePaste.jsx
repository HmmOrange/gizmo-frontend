import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function SharePaste() {
    const API_BASE = `${BACKEND_URL}/paste`;
    const { id } = useParams();

    const [paste, setPaste] = useState(null);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [needsPassword, setNeedsPassword] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");
    const fetchPaste = async (pw = "") => {
        setLoading(true);
        let url = `${API_BASE}/${encodeURIComponent(id)}`;
        if (pw) url += `?password=${encodeURIComponent(pw)}`;

        const headers = {};
        if (token) headers["Authorization"] = "Bearer " + token;

        const res = await fetch(url, { headers });
        const json = await res.json();

        if (json.error === "Password required or incorrect") {
            setNeedsPassword(true);
            setPaste(null);
        } else if (json.error) {
            setError(json.error);
            setPaste(null);
            setNeedsPassword(false);
        } else {
            setPaste(json);
            setNeedsPassword(false);
            setError("");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPaste();
    }, [id]);

    const onSubmitPassword = (e) => {
        e.preventDefault();
        fetchPaste(password);
    };

    const handleExport = async (format) => {
        const url = `${API_BASE}/${encodeURIComponent(id)}/export?format=${format}`;

        const response = await fetch(url);
        if (!response.ok) {
            alert("Export failed.");
            return;
        }

        const blob = await response.blob();
        const link = document.createElement("a");

        const ext = format === "raw" ? "md" : format;
        link.download = `${id}.${ext}`;

        link.href = window.URL.createObjectURL(blob);
        link.click();

        window.URL.revokeObjectURL(link.href);
    };

    const handleSummary = async () => {
        const url = `${API_BASE}/${encodeURIComponent(id)}/summary`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.summary) {
            alert("SUMMARY:\n\n" + json.summary);
        } else {
            alert("Failed to summarize");
        }
    };

    return (
        <div style={{
            maxWidth: 700,
            margin: "2em auto",
            fontFamily: "Menlo, Monaco, monospace",
            background: "#222",
            color: "#fff",
            padding: "2em",
            borderRadius: "8px"
        }}>
            {loading && <div>Loading...</div>}

            {!loading && needsPassword && (
                <form onSubmit={onSubmitPassword}>
                    <div style={{ marginBottom: "1em", color: "#d66" }}>
                        This paste is PRIVATE and requires a password.
                    </div>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ padding: "0.5em", marginBottom: "1em" }}
                    />
                    <button type="submit">View Paste</button>
                    {error && <div style={{ color: "#d66" }}>{error}</div>}
                </form>
            )}

            {!loading && paste && (
                <>
                    <h2 style={{ color: "#97c5f7" }}>
                        {paste.title || "Untitled Paste"}
                    </h2>

                    <pre style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        background: "#151515",
                        padding: "1em",
                        borderRadius: "4px"
                    }}>
                        {paste.content}
                    </pre>

                    {paste.date_of_expiry && (
                        <div style={{ fontSize: "0.8em", color: "#d66" }}>
                            Expires: {new Date(paste.date_of_expiry).toLocaleString()}
                        </div>
                    )}

                    <div style={{ marginTop: "1.5em" }}>
                        <button
                            onClick={() => handleExport("raw")}
                            style={{ marginRight: 10 }}
                        >
                            Export RAW
                        </button>

                        <button
                            onClick={() => handleExport("png")}
                            style={{ marginRight: 10 }}
                        >
                            Export PNG
                        </button>

                        <button
                            onClick={() => handleExport("pdf")}
                        >
                            Export PDF
                        </button>
                    </div>

                    <button
                        onClick={handleSummary}
                        style={{ marginLeft: 10, background: "#4caf50", color: "#fff" }}
                    >
                        Summarize
                    </button>
                    {paste.authorId && token && JSON.parse(atob(token.split(".")[1]))?.user_id === paste.authorId && (
                        <button
                            onClick={() => window.location.href = `/edit/${id}`}
                            style={{
                                marginLeft: 10,
                                background: "#ffb300",
                                color: "#000",
                                fontWeight: "bold",
                                padding: "0.5em 1em",
                                borderRadius: 4
                            }}
                        >
                            Edit Paste
                        </button>
                    )}
                </>
            )}

            {error && !needsPassword && (
                <div style={{ color: "#d66", fontWeight: "bold" }}>
                    ERROR: {error}
                </div>
            )}
        </div>
    );
}

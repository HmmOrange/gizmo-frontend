// src/pages/SharePaste.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { QRCodeCanvas } from "qrcode.react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function SharePaste() {
    const { id } = useParams();
    const [paste, setPaste] = useState(null);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [needsPassword, setNeedsPassword] = useState(false);
    const [error, setError] = useState("");
    const [isBookmarked, setIsBookmarked] = useState(false);

    const qrRef = useRef(null);
    const token = localStorage.getItem("token");

    const fetchPaste = async (pw = "") => {
        setLoading(true);
        let url = `${BACKEND_URL}/paste/${encodeURIComponent(id)}`;
        if (pw) url += `?password=${encodeURIComponent(pw)}`;

        const headers = token ? { Authorization: "Bearer " + token } : {};

        try {
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
                if (token) checkBookmark(id);
            }
        } catch (err) {
            console.error("fetchPaste error", err);
            setError("Failed to load paste");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaste();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const onSubmitPassword = (e) => {
        e.preventDefault();
        fetchPaste(password);
    };

    const handleExport = async (format) => {
        const url = `${BACKEND_URL}/paste/${encodeURIComponent(id)}/export?format=${format}`;
        try {
            const res = await fetch(url);
            if (!res.ok) return alert("Export failed");

            const blob = await res.blob();
            const link = document.createElement("a");
            const ext = format === "raw" ? "md" : format;
            link.download = `${id}.${ext}`;
            link.href = window.URL.createObjectURL(blob);
            link.click();
            window.URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error(err);
            alert("Export failed");
        }
    };

    const handleSummary = async () => {
        const url = `${BACKEND_URL}/paste/${encodeURIComponent(id)}/summary`;
        try {
            const res = await fetch(url);
            const json = await res.json();
            if (json.summary) alert("SUMMARY:\n\n" + json.summary);
            else alert("Failed to summarize");
        } catch (err) {
            alert("Failed to summarize");
        }
    };

    const checkBookmark = async (pasteId) => {
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/bookmarks/check?targetType=paste&targetId=${encodeURIComponent(pasteId)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setIsBookmarked(data.bookmarked);
        } catch (err) {
            console.error("Error checking bookmark:", err);
        }
    };

    const handleBookmark = async () => {
        if (!token) return alert("Please login to bookmark");

        try {
            const res = await fetch(`${BACKEND_URL}/api/bookmarks/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ targetType: "paste", targetId: id }),
            });
            if (!res.ok) throw new Error("Failed to toggle bookmark");
            const data = await res.json();
            setIsBookmarked(data.bookmarked);
        } catch (err) {
            console.error(err);
            alert("Failed to bookmark");
        }
    };

    const downloadQR = () => {
        if (!qrRef.current) return;
        const canvas = qrRef.current.querySelector("canvas");
        if (!canvas) return;
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `paste_${id}_qr.png`;
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
        <div style={{ maxWidth: 700, margin: "2em auto", fontFamily: "Menlo, Monaco, monospace", background: "#222", color: "#fff", padding: "2em", borderRadius: 8 }}>
            {loading && <div>Loading...</div>}

            {!loading && needsPassword && (
                <form onSubmit={onSubmitPassword}>
                    <div style={{ marginBottom: "1em", color: "#d66" }}>This paste is PRIVATE and requires a password.</div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "0.5em", marginBottom: "1em", width: "100%" }} />
                    <button type="submit">View Paste</button>
                    {error && <div style={{ color: "#d66" }}>{error}</div>}
                </form>
            )}

            {!loading && paste && (
                <>
                    <h2 style={{ color: "#97c5f7" }}>{paste.title || "Untitled Paste"}</h2>
                    <div style={{ background: "#151515", padding: "1em", borderRadius: 4, lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(paste.content || "")) }}
                    />
                    {paste.date_of_expiry && <div style={{ fontSize: "0.8em", color: "#d66" }}>Expires: {new Date(paste.date_of_expiry).toLocaleString()}</div>}

                    <div style={{ marginTop: 16 }}>
                        <button onClick={() => handleExport("raw")} style={{ marginRight: 8 }}>Export RAW</button>
                        <button onClick={() => handleExport("png")} style={{ marginRight: 8 }}>Export PNG</button>
                        <button onClick={() => handleExport("pdf")}>Export PDF</button>
                        <button onClick={handleBookmark} style={{ marginLeft: 10, marginRight: 10, background: isBookmarked ? "#ff6b6b" : "#4caf50", color: "#fff" }}>
                            {isBookmarked ? "❤ Bookmarked" : "🤍 Bookmark"}
                        </button>
                        <button onClick={handleSummary} style={{ background: "#4caf50", color: "#fff" }}>Summarize</button>
                    </div>

                    {paste.authorId && token && JSON.parse(atob(token.split(".")[1]))?.user_id === paste.authorId && (
                        <button onClick={() => (window.location.href = `/edit/${id}`)} style={{ marginTop: 10, background: "#ffb300", color: "#000", fontWeight: "bold", padding: "0.5em 1em", borderRadius: 4 }}>Edit Paste</button>
                    )}

                    {/* QR Code */}
                    <div style={{ marginTop: 20, textAlign: "center" }} ref={qrRef}>
                        <p>Scan QR code to open this paste:</p>
                        <QRCodeCanvas value={window.location.href} size={150} />
                        <div style={{ marginTop: 8 }}>
                            <button onClick={downloadQR} style={{ marginRight: 8 }}>Download QR</button>
                            <button onClick={copyQR}>Copy QR</button>
                        </div>
                    </div>
                </>
            )}

            {error && !needsPassword && <div style={{ color: "#d66", fontWeight: "bold" }}>ERROR: {error}</div>}
        </div>
    );
}

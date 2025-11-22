import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function EditPaste() {
    const { id } = useParams();

    const [paste, setPaste] = useState(null);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    // -----------------------
    // GET PASTE
    // -----------------------
    const fetchPaste = async (pwd = "") => {
        try {
            setLoading(true);
            setError("");

            let url = `http://localhost:3000/paste/${id}`;
            if (pwd) url += `?password=${encodeURIComponent(pwd)}`;

            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const data = await res.json();

            if (!res.ok) {
                setPaste(null);
                setError(data.error || data.message || "Không lấy được paste");
            } else {
                setPaste(data);
            }
        } catch (err) {
            setError("Lỗi server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaste();
    }, []);

    // Nếu cần password
    const submitPassword = () => fetchPaste(password);

    // -----------------------
    // UPDATE PASTE
    // -----------------------
    const updatePaste = async () => {
        try {
            const res = await fetch(`http://localhost:3000/paste/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    title: paste.title,
                    content: paste.content
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Không thể cập nhật paste");
            } else {
                alert("Cập nhật thành công!");
            }
        } catch (err) {
            alert("Lỗi kết nối server");
        }
    };

    // -----------------------
    // UI
    // -----------------------

    if (loading) return <p>Đang tải...</p>;

    if (error === "Password required or incorrect") {
        return (
            <div>
                <h3>Paste này được bảo vệ bằng mật khẩu</h3>
                <input
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={submitPassword}>Xác nhận</button>

                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        );
    }

    if (error && !paste) {
        return <p style={{ color: "red" }}>{error}</p>;
    }

    return (
        <div style={{ maxWidth: 700, margin: "2em auto" }}>
            <h2>Chỉnh sửa Paste</h2>

            {/* TITLE */}
            <input
                type="text"
                value={paste.title || ""}
                onChange={(e) => setPaste({ ...paste, title: e.target.value })}
                placeholder="Tiêu đề"
                style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "1em"
                }}
            />

            {/* CONTENT */}
            <textarea
                value={paste.content || ""}
                onChange={(e) => setPaste({ ...paste, content: e.target.value })}
                style={{
                    width: "100%",
                    height: "250px",
                    padding: "10px",
                    fontFamily: "monospace"
                }}
            />

            <button
                onClick={updatePaste}
                style={{
                    marginTop: "1em",
                    padding: "10px 20px",
                    background: "#4caf50",
                    color: "#fff",
                    border: "none"
                }}
            >
                Lưu thay đổi
            </button>
        </div>
    );
}

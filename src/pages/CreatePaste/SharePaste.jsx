// src/pages/SharePaste.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { QRCodeCanvas } from "qrcode.react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Separator } from "../../components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import {
  Heart,
  Flag,
  ChevronDown,
  QrCode,
  Pencil,
  FileText,
  FileImage,
  File,
  Loader2,
  Lock,
  Eye,
} from "lucide-react";

// Lấy URL Backend từ biến môi trường
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

  // Hàm xử lý Báo cáo
  const handleReport = () => {
    // Thêm logic mở modal báo cáo hoặc gọi API
    console.log(`Reporting paste with ID: ${id}`);
    alert("Đã gửi báo cáo. Cảm ơn bạn!");
  };

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
        setError(
          json.error === "Password required or incorrect"
            ? "Mật khẩu không đúng"
            : ""
        );
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
      setError("Không thể tải paste. Lỗi kết nối máy chủ.");
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
    const url = `${BACKEND_URL}/paste/${encodeURIComponent(
      id
    )}/export?format=${format}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return alert("Xuất dữ liệu thất bại");

      const blob = await res.blob();
      const link = document.createElement("a");
      const ext = format === "raw" ? "md" : format;
      link.download = `${id}.${ext}`;
      link.href = window.URL.createObjectURL(blob);
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
      alert("Xuất dữ liệu thất bại");
    }
  };

  const handleSummary = async () => {
    const url = `${BACKEND_URL}/paste/${encodeURIComponent(id)}/summary`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.summary) alert("TÓM TẮT (AI):\n\n" + json.summary);
      else alert("Không thể tóm tắt.");
    } catch (err) {
      alert("Không thể tóm tắt.");
    }
  };

  const checkBookmark = async (pasteId) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/bookmarks/check?targetType=paste&targetId=${encodeURIComponent(
          pasteId
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setIsBookmarked(data.bookmarked);
    } catch (err) {
      console.error("Error checking bookmark:", err);
    }
  };

  const handleBookmark = async () => {
    if (!token) return alert("Vui lòng đăng nhập để đánh dấu.");

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
      alert("Đánh dấu thất bại.");
    }
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    // Tìm phần tử canvas bên trong ref
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

    // Sử dụng canvas.toBlob để lấy dữ liệu ảnh dưới dạng Blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        // Sử dụng Clipboard API để sao chép Blob ảnh
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        alert("Mã QR đã được sao chép vào clipboard!");
      } catch (err) {
        console.error(err);
        alert("Sao chép mã QR thất bại.");
      }
    });
  };

  // --- LOGIC XÁC ĐỊNH CHỦ SỞ HỮU VÀ THỜI GIAN ---

  let isOwner = false;
  let decodedToken = null;

  if (token) {
    try {
      // Giải mã payload của JWT (phần ở giữa)
      const payload = token.split(".")[1];
      if (payload) {
        decodedToken = JSON.parse(atob(payload));
      }
    } catch (e) {
      // Bỏ qua nếu token không hợp lệ hoặc không giải mã được
      // console.error("Failed to decode token:", e);
    }
  }

  if (paste && decodedToken) {
    // So sánh user_id trong token với authorId của paste
    // Giả định user_id là trường ID người dùng trong JWT payload
    if (paste.authorId && decodedToken.user_id === paste.authorId) {
      isOwner = true;
    }
  }

  const lastModified = paste
    ? paste.updatedAt || paste.updated_at || paste.createdAt
    : null;
  const createdAt = paste ? paste.createdAt : null;

  return (
    <Card className="max-w-4xl mx-auto my-8 font-sans">
      {/* Header cho cả 2 trạng thái: Có và Không có nội dung */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {loading && (
          <CardTitle className="text-xl flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
          </CardTitle>
        )}
        {!loading && !paste && needsPassword && (
          <CardTitle className="text-xl flex items-center gap-2 text-red-500">
            <Lock className="w-5 h-5" /> Paste riêng tư
          </CardTitle>
        )}
        {!loading && !paste && error && (
          <CardTitle className="text-xl text-red-500">Lỗi: {error}</CardTitle>
        )}
        {!loading && paste && (
          <CardTitle className="text-xl font-bold text-black-600">
            {paste.title || "Untitled Paste"}
          </CardTitle>
        )}

        {/* Khu vực Báo cáo & Yêu thích (Report & Favourite) - Góc phải trên cùng */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReport}
            title="Báo cáo"
          >
            <Flag className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            title={isBookmarked ? "Đã yêu thích" : "Yêu thích"}
            disabled={!token} // Vô hiệu hóa nếu chưa đăng nhập
          >
            {isBookmarked ? (
              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            ) : (
              <Heart className="w-5 h-5 text-gray-400" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Trạng thái Loading */}
        {loading && (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}

        {/* Trạng thái Yêu cầu mật khẩu */}
        {!loading && needsPassword && (
          <form onSubmit={onSubmitPassword} className="space-y-4 pt-4">
            <p className="text-red-500 font-medium">
              Paste này là **RIÊNG TƯ** và yêu cầu mật khẩu.
            </p>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="paste-password">Mật khẩu</Label>
              <Input
                id="paste-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
              />
            </div>
            <Button type="submit">Xem Paste</Button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        )}

        {/* Trạng thái Hiển thị nội dung Paste */}
        {!loading && paste && (
          <>
            {/* Nội dung chính (Content) */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[200px] overflow-auto mb-4">
              <div
                className="prose dark:prose-invert max-w-none whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(paste.content || "")),
                }}
              />
            </div>

            {/* Khu vực thông tin và nút hành động (Dựa trên phác thảo) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-start">
              {/* Cột 1: Nút Hành động */}
              <div className="flex flex-col gap-2">
                {/* Nút Edit (Chỉ hiển thị cho chủ sở hữu đã đăng nhập) */}
                {isOwner && (
                  <Button
                    onClick={() => (window.location.href = `/edit/${id}`)}
                    variant="outline"
                    className="w-full justify-start border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Chỉnh sửa (Edit)
                  </Button>
                )}
                {/* Nút AI Summary */}
                <Button
                  onClick={handleSummary}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  AI Summary
                </Button>
              </div>

              {/* Cột 2: Export Dropdown (thay thế nút dropdown trong ảnh) */}
              <div className="flex flex-col gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      Export
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => handleExport("raw")}>
                      <FileText className="w-4 h-4 mr-2" /> Xuất RAW (MD)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("png")}>
                      <FileImage className="w-4 h-4 mr-2" /> Xuất PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <File className="w-4 h-4 mr-2" /> Xuất PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Hiển thị Ngày tạo (Created) */}
              </div>

              {/* Cột 3: Thông tin chi tiết */}
              <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-400">
                <div className="flex justify-between">
                  <span className="font-semibold">Ngày tạo:</span>{" "}
                  {createdAt ? new Date(createdAt).toLocaleString() : "N/A"}
                </div>

                <div className="flex justify-between">
                  <span className="font-semibold">Cập nhật cuối:</span>
                  <span>
                    {lastModified
                      ? new Date(lastModified).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                {/* Hàng 2 (MỚI): Lượt xem và Yêu thích (Icon) */}
                <div className="flex items-center gap-4 mt-1 justify-end">
                  {/* Lượt xem */}
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {/* Icon mắt */}
                    <span>{paste.views ?? 0}</span>
                  </div>

                  {/* Yêu thích */}
                  <div className="flex items-center gap-1">
                    {/* Sử dụng Heart icon, có thể tô màu đỏ nếu thích */}
                    <Heart className="w-4 h-4" />
                    <span>{paste.favorites ?? 0}</span>
                  </div>
                </div>

                {paste.date_of_expiry && (
                  <div className="text-red-500 mt-1">
                    <span className="font-semibold">Hết hạn:</span>{" "}
                    {new Date(paste.date_of_expiry).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Khu vực QR Code */}
            <div className="flex flex-col items-center gap-4">
              <p className="font-semibold text-gray-600 dark:text-gray-300 flex items-center">
                <QrCode className="w-5 h-5 mr-2" /> Quét QR để mở:
              </p>
              <div ref={qrRef} className="p-2 border rounded-lg bg-white">
                <QRCodeCanvas
                  value={
                    typeof window !== "undefined"
                      ? window.location.href
                      : `${BACKEND_URL}/share/${id}` // Fallback cho SSR/Dev
                  }
                  size={120}
                  level="H"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={downloadQR} variant="secondary">
                  Tải xuống QR
                </Button>
                <Button onClick={copyQR} variant="secondary">
                  Sao chép QR
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

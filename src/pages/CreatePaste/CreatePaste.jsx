import { useState, useEffect } from "react";
import NavBar from "../../components/NavBar/NavBar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "./CreatePaste.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

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

  // change tab button
  const [currentTab, setCurrentTab] = useState("text");

  // use tab trigger
  const [tab, setTab] = useState("text");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // const handlePreview = () => {

  //   const dirty = marked.parse(form.content || "");
  //   const render = DOMPurify.sanitize(dirty);
  //   setPreviewHTML(render);
  //   setPreviewMode(true);

  //   setCurrentTab("preview"); // chuyen sang preview
  // };

  const handlePreview = () => {
    // Nếu có title, thêm Heading 1 vào trước nội dung
    const markdownWithTitle = form.title
      ? `# ${form.title}\n\n${form.content || ""}`
      : form.content || "";

    // Parse markdown
    const dirty = marked.parse(markdownWithTitle);

    // Sanitize HTML
    const render = DOMPurify.sanitize(dirty);

    // Set HTML preview
    setPreviewHTML(render);
    setPreviewMode(true);

    // Chuyển sang tab preview
    setCurrentTab("preview");
  };

  const closePreview = () => setPreviewMode(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const convertExposure =
      form.exposure === "password" ? "password_protected" : form.exposure;

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
        setCreateResult(`${FRONTEND_URL}/i/${json.slug}`);
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

  // render tu dong
  useEffect(() => {
    if (tab === "preview") {
      handlePreview(); // tự động render markdown
    }
  }, [tab]);

  return (
    <>
      <NavBar token={token} setToken={setToken} />

      <Tabs
        defaultValue="text"
        className="w-[700px] mx-auto"
        value={tab}
        onValueChange={setTab}
      >
        {/* 1. Phần Danh Sách Tabs */}
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* 2. Phần Nội Dung Tabs */}

        {/* Nội dung cho Tab "Tài khoản" */}
        <TabsContent value="text">
          <div className="max-w-2xl mx-auto mt-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter title"
                />
              </div>

              {/* Markdown Content */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Write your markdown content..."
                  className="min-h-[250px] font-mono"
                />
              </div>

              {/* Exposure Select */}
              <div className="flex items-center gap-4">
                <Label htmlFor="exposure" className="w-40 text-right">
                  Exposure
                </Label>

                <Select
                  name="exposure"
                  onValueChange={(value) =>
                    handleChange({ target: { name: "exposure", value } })
                  }
                  className="flex-1"
                >
                  <SelectTrigger id="exposure">
                    <SelectValue placeholder="Select exposure" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="password">Password Protected</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expire */}
              <div className="flex items-center gap-4">
                <Label htmlFor="date_of_expiry" className="w-40 text-right">
                  Expiry Date (optional)
                </Label>
                <Input
                  id="date_of_expiry"
                  type="datetime-local"
                  name="date_of_expiry"
                  value={form.date_of_expiry}
                  onChange={handleChange}
                  className="flex-1"
                />
              </div>

              {/* Custom URL */}
              <div className="flex items-center gap-4">
                <Label htmlFor="slug" className="w-40 text-right">
                  Custom URL (optional)
                </Label>
                <Input
                  id="slug"
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="Enter a custom URL"
                  className="flex-1"
                />
              </div>

              {/* Password Field */}
              {form.exposure === "password" && (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 justify-end">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Paste
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Nội dung cho Tab "preview" */}
        <TabsContent value="preview">
          <div
            className="markdown-body p-4 border rounded-md min-h-[550px]"
            dangerouslySetInnerHTML={{ __html: previewHTML }}
          />
        </TabsContent>

        <TabsContent value="usage">
          <div className="space-y-6 p-4">
            <h2 className="text-2xl font-bold text-center">
              📖 Markdown Usage Guide
            </h2>

            {/* --- Bảng 2 cột: Input vs Output --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Input */}
              <div>
                <h3 className="font-semibold mb-2 text-lg">
                  📝 What you type (Input)
                </h3>
                <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm shadow-inner">
                  {`# Header 1
## Header 2

Return once starts a new line.
Return twice starts new paragraph.

*Italics*
**Bold**
~~Strikeout~~
==Mark==
%red% Colored Text %%
%#ACBDEF% Colored Text Hex %%
!>Spoiler`}
                </pre>
              </div>

              {/* Right: Output */}
              <div>
                <h3 className="font-semibold mb-2 text-lg">
                  ✨ What will be published (Output)
                </h3>
                <div className="p-4 border rounded-lg text-sm space-y-2 bg-white dark:bg-gray-900 shadow">
                  {/* Giả định cách render Markdown cho các ví dụ cơ bản */}
                  <h1 className="text-2xl font-bold border-b pb-1">Header 1</h1>
                  <h2 className="text-xl font-semibold">Header 2</h2>

                  {/* New line / Paragraphs */}
                  <p>
                    Return once starts a new line.
                    <br />
                    Return twice starts new paragraph.
                  </p>

                  <p>
                    *<em className="italic">Italics</em>*
                    <br />
                    **<strong>Bold</strong>**
                    <br />
                    ~~<s className="line-through">Strikeout</s>~~
                    <br />
                    ==<span className="bg-yellow-200 px-1 rounded">Mark</span>==
                    <br />%<span className="text-red-500">Colored Text</span>%%
                    <br />
                    %#<span className="text-[#ACBDEF]">Colored Text Hex</span>%%
                    <br />
                    !&gt;
                    <span className="bg-gray-200 dark:bg-gray-700 p-1 rounded inline-block">
                      Spoiler
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <hr className="my-6 border-gray-300 dark:border-gray-700" />

            {/* --- Danh sách các rule khác --- */}
            <div className="space-y-4">
              {/* Underlines */}
              <h3 className="font-semibold text-lg">➖ Underlines</h3>
              <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {`!~ Simple Underlined Text ~!
!~red; Underlined Text With Color ~!
!~green;double; Underlined Text Plus Style ~!
!~blue;default;line-through; Underlined Plus Type ~!
!~orange;default;default;7; Underlined With Thickness ~!`}
              </pre>

              {/* Lists */}
              <h3 className="font-semibold text-lg">📋 Lists</h3>
              <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {`- Bulleted list item a
- Bulleted list item b
  - Nested item b1

1. Numbered list item
2. Numbered list item
  1. Nested list item

- [ ] Checkbox 1
- [x] Checkbox 2`}
              </pre>

              {/* Comments */}
              <h3 className="font-semibold text-lg">💬 Comments</h3>
              <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {`[//]: (comment here)`}
              </pre>

              {/* Quotes */}
              <h3 className="font-semibold text-lg">❝ Quotes</h3>
              <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {`> How to use quotes in Markdown?
> Just prepend text with >`}
              </pre>

              {/* Code Blocks */}
              <h3 className="font-semibold text-lg">💻 Code Blocks</h3>
              <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {`\`\`\`python
s = "Triple backticks generate code block"
print(s)
\`\`\`
Inline code uses single backtick`}
              </pre>

              {/* Horizontal Rule (Output Example) */}
              <h3 className="font-semibold text-lg">📏 Horizontal Rule</h3>
              <div className="p-4 border rounded-lg bg-white dark:bg-gray-900 text-sm shadow">
                <p>This is above the rule.</p>
                <hr className="my-4 border-gray-300 dark:border-gray-700" />
                <p>This is below the rule (Input: `---` or `***`).</p>
              </div>

              {/* Tables */}
              <h3 className="font-semibold text-lg">📊 Tables</h3>
              <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {`| Header 1 | Header 2 |
|----------|----------|
| Cell 1.1 | Cell 1.2 |
| Cell 2.1 | Cell 2.2 |`}
              </pre>

              {/* Admonitions */}
              <h3 className="font-semibold text-lg">💡 Admonitions</h3>
              <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {`!!! note Title
Admonition text

Main types: info, note, warning, danger`}
              </pre>

              {/* Links */}
              <h3 className="font-semibold text-lg">🔗 Links</h3>
              <pre className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {`[Markdown paste service](https://rentry.co/)
<https://rentry.co/>`}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "900px",
          margin: "2em auto",
        }}
      >
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
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            background: "#17a2b8",
            color: "white",
            cursor: "pointer",
            marginBottom: "1em",
          }}
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
                  <div
                    style={{
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      marginTop: "0.5em",
                    }}
                  >
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
            style={{
              padding: "8px",
              flex: 1,
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={fetchPaste}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              background: "#ffc107",
              color: "white",
              cursor: "pointer",
            }}
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

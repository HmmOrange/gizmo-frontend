"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchUserPastes } from "../../lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Eye, Heart } from "lucide-react"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

function shortText(text, len = 120) {
  if (!text) return ""
  return text.length > len ? text.slice(0, len) + "..." : text
}

export default function MyPastes() {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [loading, setLoading] = useState(true)
  const [pastes, setPastes] = useState([])
  const [bookmarkedPastes, setBookmarkedPastes] = useState([])
  const [bookmarksObj, setBookmarksObj] = useState(null)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("views")
  const [activeTab, setActiveTab] = useState("mine")

  useEffect(() => {
    if (!token) {
      setError("Please sign in to view your pastes")
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const p = await fetchUserPastes(token)
        console.log("Received from fetchUserPastes:", p)
        const pastesArray = Array.isArray(p) ? p : p.pastes || p
        console.log("Processed pastes array:", pastesArray)
        setPastes(pastesArray || [])

        const res = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/api/dashboard/bookmarks`, {
          headers: { Authorization: "Bearer " + token },
        })
        if (res.ok) {
          const json = await res.json()
          setBookmarksObj(json)
          const bp = json?.pastes || []
          setBookmarkedPastes(bp || [])
        }
      } catch (err) {
        console.error("MyPastes load error", err)
        setError(err.message || String(err))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  const totalPastes = pastes.length
  const totalViews = pastes.reduce((s, it) => s + (Number(it.views) || 0), 0)

  window.console.log(bookmarksObj)
  const totalBookmarksCount = bookmarksObj ? bookmarksObj.pastes?.length || 0 : 0

  const filterAndSort = (items) => {
    const q = (query || "").trim().toLowerCase()
    let filtered = Array.isArray(items) ? items.slice() : []
    if (q) filtered = filtered.filter((it) => (it.title || it.slug || "").toLowerCase().includes(q))

    const key = sortBy === "views" ? "views" : "bookmarks"
    filtered.sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0))
    return filtered
  }

  const renderPasteCard = (p) => (
    <Card
      key={p.pasteId || p.slug || p.id || p._id}
      className="mb-3 cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/i/${p.slug || p.pasteId || p.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">{p.title || p.slug || "Untitled"}</span>
          <span className="text-xs text-muted-foreground">{new Date(p.updatedAt || p.createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{shortText(p.content || p.body || "", 160)}</p>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{p.views || 0}</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{p.bookmarks ?? p.bookmarkCount ?? 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      {!token && <p className="text-destructive">Please sign in to view this page.</p>}

      {token && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Pastes</p>
                  <p className="text-2xl font-bold text-foreground">{totalPastes}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Views (your pastes)</p>
                  <p className="text-2xl font-bold text-foreground">{totalViews}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your Favourites</p>
                  <p className="text-2xl font-bold text-foreground">{totalBookmarksCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-4 flex gap-3">
            <Button variant={activeTab === "mine" ? "default" : "secondary"} onClick={() => setActiveTab("mine")}>
              My pastes
            </Button>
            <Button
              variant={activeTab === "bookmarks" ? "default" : "secondary"}
              onClick={() => setActiveTab("bookmarks")}
            >
              Favourites
            </Button>
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search by title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Sort by views</SelectItem>
                <SelectItem value="bookmarks">Sort by Favourites</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            {loading && <p className="text-muted-foreground">Loading...</p>}
            {!loading && error && <p className="text-destructive">{error}</p>}

            {!loading && !error && activeTab === "mine" && (
              <div>
                {filterAndSort(pastes).length === 0 ? (
                  <p className="text-muted-foreground">No pastes found.</p>
                ) : (
                  filterAndSort(pastes).map(renderPasteCard)
                )}
              </div>
            )}

            {!loading && !error && activeTab === "bookmarks" && (
              <div>
                {filterAndSort(bookmarkedPastes).length === 0 ? (
                  <p className="text-muted-foreground">No Favourites found.</p>
                ) : (
                  filterAndSort(bookmarkedPastes).map(renderPasteCard)
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

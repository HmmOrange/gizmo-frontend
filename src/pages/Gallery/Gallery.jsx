"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchUserImages, fetchUserAlbums } from "../../lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageIcon, FolderOpen, Eye, Heart } from "lucide-react"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

function shortText(text, len = 120) {
  if (!text) return ""
  return text.length > len ? text.slice(0, len) + "..." : text
}

export default function Gallery() {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState([])
  const [albums, setAlbums] = useState([])
  const [bookmarkedImages, setBookmarkedImages] = useState([])
  const [bookmarksObj, setBookmarksObj] = useState(null)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("views")
  const [activeTab, setActiveTab] = useState("images")

  useEffect(() => {
    if (!token) {
      setError("Please sign in to view your gallery")
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const imgs = await fetchUserImages(token)
        console.log("fetchUserImages", imgs)
        const imgsArray = Array.isArray(imgs) ? imgs : imgs.images || imgs
        setImages(imgsArray || [])

        const albs = await fetchUserAlbums(token)
        const albsArray = Array.isArray(albs) ? albs : albs.albums || albs
        setAlbums(albsArray || [])

        const res = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/api/dashboard/bookmarks`, {
          headers: { Authorization: "Bearer " + token },
        })
        if (res.ok) {
          const json = await res.json()
          setBookmarksObj(json)
          setBookmarkedImages(json?.images || [])
        }
      } catch (err) {
        console.error("Gallery load error", err)
        setError(err.message || String(err))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  const totalImages = images.length
  const totalAlbums = albums.length
  const totalImageViews = images.reduce((s, it) => s + (Number(it.views) || 0), 0)
  const totalImageBookmarks = bookmarksObj ? bookmarksObj.images?.length || 0 : 0

  const filterAndSort = (items) => {
    const q = (query || "").trim().toLowerCase()
    let filtered = Array.isArray(items) ? items.slice() : []
    if (q)
      filtered = filtered.filter((it) => (it.title || it.name || it.caption || it.slug || "").toLowerCase().includes(q))

    const key = sortBy === "views" ? "views" : "bookmarks"
    filtered.sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0))
    return filtered
  }

  const renderImageCard = (i) => {
    const imageUrl = i.url || i.imageUrl || i.src || "/placeholder.svg"

    return (
      <Card
        key={i._id || i.slug}
        className="group cursor-pointer transition-all hover:shadow-xl overflow-hidden border-0 p-0"
        onClick={() => navigate(`/share/image/${i.slug || i._id}`)}
      >
        <CardContent className="p-0 relative">
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={i.title || i.caption || "Image"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                e.target.src = "/placeholder.svg"
              }}
            />
          </div>
          {/* Stats overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <div className="flex items-center gap-4 text-xs text-white/90">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{i.views || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span>{i.bookmarks ?? i.bookmarkCount ?? 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAlbumCard = (a) => {
    const imageCount = a.images?.length || a.imageCount || 0

    return (
      <Card
        key={a._id || a.slug}
        className="group cursor-pointer transition-all hover:shadow-xl overflow-hidden border-0 p-0"
        onClick={() => navigate(`/share/album/${a.slug || a._id}`)}
      >
        <CardContent className="p-0 relative">
          <div className="aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
            <div className="text-center p-6">
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-primary/10 p-4">
                  <FolderOpen className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                {a.name || a.slug || "Untitled"}
              </h3>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>{imageCount} {imageCount === 1 ? 'image' : 'images'}</span>
              </div>
            </div>
          </div>
          {/* Stats overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
            <div className="flex items-center gap-4 text-xs text-white/90">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{a.views || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span>{a.bookmarks ?? a.bookmarkCount ?? 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statsData = [
    { label: "Total Images", value: totalImages, icon: ImageIcon },
    { label: "Total Albums", value: totalAlbums, icon: FolderOpen },
    { label: "Total Image Views", value: totalImageViews, icon: Eye },
    { label: "Favourites", value: totalImageBookmarks, icon: Heart },
  ]

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {!token && <div className="text-destructive">Please sign in to view this page.</div>}

      {token && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {statsData.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="images">My images</TabsTrigger>
                <TabsTrigger value="albums">My albums</TabsTrigger>
                <TabsTrigger value="bookmarks">Favourites</TabsTrigger>
              </TabsList>

              <div className="flex flex-1 gap-3 sm:max-w-md">
                <Input
                  placeholder="Search by title..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="views">Sort by views</SelectItem>
                    <SelectItem value="bookmarks">Sort by favourites</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading && <div className="py-12 text-center text-muted-foreground">Loading...</div>}

            {!loading && error && <div className="py-12 text-center text-destructive">{error}</div>}

            {!loading && !error && (
              <>
                <TabsContent value="images" className="mt-0">
                  {filterAndSort(images).length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No images found.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {filterAndSort(images).map(renderImageCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="albums" className="mt-0">
                  {filterAndSort(albums).length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No albums found.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {filterAndSort(albums).map(renderAlbumCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bookmarks" className="mt-0">
                  {filterAndSort(bookmarkedImages).length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No favourites found.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {filterAndSort(bookmarkedImages).map(renderImageCard)}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </>
      )}
    </div>
  )
}

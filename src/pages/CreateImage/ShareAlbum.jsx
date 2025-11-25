"use client"

import { useParams, Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import NavBar from "../../components/NavBar/NavBar"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Heart, Pencil, Clock } from "lucide-react"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

export default function ShareAlbum() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [album, setAlbum] = useState(null)
  const [albumBookmarked, setAlbumBookmarked] = useState(false)
  const [albumBookmarkCount, setAlbumBookmarkCount] = useState(0)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUserId = localStorage.getItem("userId")
    if (savedToken) setToken(savedToken)
    if (savedUserId) setUserId(savedUserId)
  }, [])

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `${BACKEND_URL.replace(/\/$/, "")}/share/album/${encodeURIComponent(slug)}`
        const res = await axios.get(url, {
          headers: token ? { Authorization: "Bearer " + token } : {},
        })
        const alb = res.data.album || null
        setAlbum(alb)
        setAlbumBookmarkCount(alb?.bookmarkCount || 0)
        try {
          const tokenLocal = localStorage.getItem("token")
          if (tokenLocal && alb?._id) {
            const chk = await axios.get(`${BACKEND_URL.replace(/\/$/, "")}/api/bookmarks/check`, {
              params: { targetType: "album", targetId: alb._id },
              headers: { Authorization: "Bearer " + tokenLocal },
            })
            setAlbumBookmarked(!!chk.data?.bookmarked)
          } else {
            setAlbumBookmarked(false)
          }
        } catch (e) {
          setAlbumBookmarked(false)
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchAlbum()
  }, [slug, token])

  const isAuthor = album && userId && String(album.authorId) === String(userId)

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {loading && <p className="text-center text-muted-foreground">Loading album...</p>}

          {!loading && error && !album && <div className="text-destructive text-center">Error: {String(error)}</div>}

          {!loading && album && (
            <Card>
              <CardHeader className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">{album.name}</h1>
                {album.description && <p className="text-muted-foreground">{album.description}</p>}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>{(album.images || []).reduce((sum, img) => sum + (img.view || img.views || 0), 0)}</span>
                  </div>
                  <span className="text-border">|</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>
                      {(() => {
                        const imgs = album.images || []
                        if (!imgs.length) return "N/A"
                        const last = imgs.reduce((latest, img) => {
                          const time = new Date(img.createdAt)
                          return time > latest ? time : latest
                        }, new Date(0))
                        return last.toLocaleString()
                      })()}
                    </span>
                  </div>
                </div>
                {/* Visibility and actions row */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Badge variant="secondary">{album.exposure}</Badge>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button
                      variant={albumBookmarked ? "default" : "secondary"}
                      onClick={async () => {
                        try {
                          const tokenLocal = localStorage.getItem("token")
                          const res = await axios.post(
                            `${BACKEND_URL.replace(/\/$/, "")}/api/bookmarks/toggle`,
                            { targetType: "album", targetId: album._id },
                            {
                              headers: tokenLocal ? { Authorization: "Bearer " + tokenLocal } : {},
                            },
                          )
                          setAlbumBookmarked(res.data.bookmarked)
                          setAlbumBookmarkCount(res.data.count || 0)
                        } catch (err) {
                          if (err.response?.status === 401) return alert("Please sign in to favourite")
                          console.error(err)
                          alert("Failed to toggle favourite")
                        }
                      }}
                      className="gap-1.5"
                    >
                      <Heart className={`h-4 w-4 ${albumBookmarked ? "fill-current" : ""}`} />
                      {albumBookmarked ? "Favourited" : "Favourite"}
                    </Button>
                    {/* Hidden bookmark count as per original */}
                    <span className="hidden text-sm text-muted-foreground">
                      {albumBookmarkCount} favourite
                      {albumBookmarkCount !== 1 ? "s" : ""}
                    </span>
                    {isAuthor && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/edit/album/${album._id}`)}
                        className="gap-1.5"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {(album.images || []).map((img) => (
                    <Card key={img._id} className="overflow-hidden">
                      <Link to={`/i/image/${img.slug}`}>
                        <img
                          src={img.imageUrl || "/placeholder.svg"}
                          alt={img.caption || ""}
                          className="h-40 w-full object-cover"
                        />
                      </Link>
                      <CardContent className="p-3 text-center">
                        <p className="text-sm text-foreground truncate">{img.caption || img.slug}</p>
                        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          <span>
                            {img.bookmarkCount || 0} favourite
                            {(img.bookmarkCount || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

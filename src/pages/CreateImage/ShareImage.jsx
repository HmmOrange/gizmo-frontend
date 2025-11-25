"use client"

// src/pages/ShareImage.jsx

import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import NavBar from "../../components/NavBar/NavBar"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Heart, Pencil, Clock, LinkIcon } from "lucide-react"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

export default function ShareImage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [image, setImage] = useState(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [error, setError] = useState(null)
  const [password, setPassword] = useState("")
  const [needsPassword, setNeedsPassword] = useState(false)
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUserId = localStorage.getItem("userId")
    if (savedToken) setToken(savedToken)
    if (savedUserId) setUserId(savedUserId)
  }, [])

  const fetchImage = async (pw = null) => {
    setLoading(true)
    setError(null)
    try {
      const url = `${BACKEND_URL.replace(/\/$/, "")}/share/image/${encodeURIComponent(slug)}`
      const res = await axios.get(url, {
        params: pw ? { password: pw } : {},
        headers: token ? { Authorization: "Bearer " + token } : {},
      })
      if (res.data && res.data.requirePassword) {
        setNeedsPassword(true)
        setImage(null)
      } else {
        setImage(res.data.image || null)
        setBookmarked(!!res.data.image?.bookmarked)
        setBookmarkCount(res.data.image?.bookmarkCount || 0)
        setNeedsPassword(false)
      }
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message
      if (err.response?.data?.requirePassword) {
        setNeedsPassword(true)
        setImage(null)
      } else if (status === 401 && String(msg).toLowerCase().includes("password")) {
        setNeedsPassword(true)
        setImage(null)
      } else if (status === 403) {
        setError("You do not have permission to view this image")
      } else if (status === 404) {
        setError("Image not found")
      } else {
        setError("Error loading image: " + msg)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token])

  const isAuthor = image && userId && String(image.authorId) === String(userId)

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {loading && <p className="text-center text-muted-foreground">Loading...</p>}

          {!loading && error && !image && <div className="text-destructive text-center mb-3">{error}</div>}

          {!loading && needsPassword && (
            <Card className="text-center">
              <CardHeader>
                <p className="text-muted-foreground">
                  This image is password protected. Please enter the password to view.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="max-w-xs"
                />
                <Button onClick={() => fetchImage(password)}>Submit</Button>
              </CardContent>
            </Card>
          )}

          {!loading && image && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={image.imageUrl || "/placeholder.svg"}
                  alt={image.caption || "Shared image"}
                  className="w-full max-h-[80vh] object-contain"
                />
              </CardContent>
              <CardHeader className="pb-2">
                {image.caption && <p className="text-foreground text-lg font-medium">{image.caption}</p>}
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Stats row with icons */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>{image.views ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(image.updatedAt || image.updated_at || image.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {/* Link display */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground break-all">
                  <LinkIcon className="h-4 w-4 shrink-0" />
                  <span>{window.location.href}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center gap-3 pt-0">
                <Button
                  variant={bookmarked ? "default" : "secondary"}
                  onClick={async () => {
                    try {
                      const tokenLocal = localStorage.getItem("token")
                      const res = await axios.post(
                        `${BACKEND_URL.replace(/\/$/, "")}/api/bookmarks/toggle`,
                        { targetType: "image", targetId: image._id },
                        {
                          headers: tokenLocal ? { Authorization: "Bearer " + tokenLocal } : {},
                        },
                      )
                      setBookmarked(res.data.bookmarked)
                      setBookmarkCount(res.data.count || 0)
                    } catch (err) {
                      if (err.response?.status === 401) return alert("Please sign in to bookmark")
                      console.error(err)
                      alert("Failed to toggle bookmark")
                    }
                  }}
                  className="gap-1.5"
                >
                  <Heart className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
                  {bookmarked ? "Favourited" : "Favourite"}
                </Button>
                {/* Hidden bookmark count as per original */}
                <span className="hidden text-sm text-muted-foreground">
                  {bookmarkCount} favourite{bookmarkCount !== 1 ? "s" : ""}
                </span>
                {isAuthor && (
                  <Button variant="outline" onClick={() => navigate(`/edit/image/${image._id}`)} className="gap-1.5">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

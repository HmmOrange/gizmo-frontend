"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../../context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ImageIcon, FolderOpen, Eye, Bookmark, Users, Clock, Trophy, Loader2 } from "lucide-react"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const token = localStorage.getItem("token")

  const [stats, setStats] = useState(null)
  const [bookmarks, setBookmarks] = useState(null)
  const [topLists, setTopLists] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStats()
    fetchTopLists()
    if (token) {
      fetchBookmarks()
    }
  }, [])

  const fetchTopLists = async () => {
    try {
      const headers = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      const res = await fetch(`${BACKEND_URL}/api/dashboard/top?limit=5`, { headers })
      if (!res.ok) throw new Error("Failed to fetch top lists")
      const data = await res.json()
      setTopLists(data)
    } catch (err) {
      console.error("Error fetching top lists:", err)
    }
  }

  const fetchStats = async () => {
    try {
      const headers = {}
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch(`${BACKEND_URL}/api/dashboard/stats`, { headers })
      if (!res.ok) throw new Error("Failed to fetch stats")
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching stats:", err)
      setError("Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/bookmarks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch bookmarks")
      const data = await res.json()
      setBookmarks(data)
    } catch (err) {
      console.error("Error fetching bookmarks:", err)
    }
  }

  const StatCard = ({ title, allTime, last24h, icon: Icon }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-2xl font-bold">{allTime || 0}</p>
            <p className="text-xs text-muted-foreground">All Time</p>
          </div>
          <div className="border-l pl-4">
            <p className="text-lg font-semibold text-primary">{last24h || 0}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Last 24h
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const LeaderboardTable = ({ title, rows, type, sortBy = "views" }) => {
    const sorted =
      rows && rows.length ? [...rows].sort((a, b) => (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0)) : []

    const displayed = sorted.slice(0, 5)

    const getDisplayName = (r) => {
      if (type === "album") return r.name ?? r.slug ?? r._id ?? ""
      return r.slug ?? r._id ?? r.title ?? r.name ?? ""
    }

    const getSlugForNav = (r) => r.slug ?? r._id ?? ""

    const getCount = (r) => Number(r[sortBy] || r.views || r.bookmarks || r.bookmarkCount || 0)

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-2">Slug</th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length ? (
                displayed.map((r, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      const slug = getSlugForNav(r)
                      if (type === "paste") navigate(`/i/${slug}`)
                      if (type === "image") navigate(`/i/image/${slug}`)
                      if (type === "album") navigate(`/i/album/${slug}`)
                    }}
                  >
                    <td className="py-2 px-2 text-sm truncate max-w-[150px]">{getDisplayName(r)}</td>
                    <td className="py-2 px-2 text-sm text-right font-medium">{getCount(r)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-sm text-muted-foreground">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    )
  }

  const BookmarkItem = ({ item, type }) => {
    const handleClick = () => {
      if (type === "paste") {
        navigate(`/i/${item.slug}`)
      } else if (type === "image") {
        navigate(`/i/image/${item.slug}`)
      } else if (type === "album") {
        navigate(`/i/album/${item.slug}`)
      }
    }

    const TypeIcon = type === "paste" ? FileText : type === "image" ? ImageIcon : FolderOpen

    return (
      <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            {type === "image" && item.imageUrl && (
              <img
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.caption}
                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h4 className="font-medium text-sm truncate">
                  {item.title || item.name || item.caption || "Untitled"}
                </h4>
              </div>
              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary mb-1">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{item.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Bookmarked: {new Date(item.bookmarkedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Global statistics and your bookmarks</p>
        </div>

        {error && <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Global Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats && (
              <>
                <StatCard
                  title="Pastes"
                  allTime={stats.pastes.allTime}
                  last24h={stats.pastes.last24h}
                  icon={FileText}
                />
                <StatCard
                  title="Images"
                  allTime={stats.images.allTime}
                  last24h={stats.images.last24h}
                  icon={ImageIcon}
                />
                <StatCard
                  title="Albums"
                  allTime={stats.albums.allTime}
                  last24h={stats.albums.last24h}
                  icon={FolderOpen}
                />
                <StatCard title="Views" allTime={stats.views.allTime} last24h={stats.views.last24h} icon={Eye} />
                <StatCard
                  title="Bookmarks"
                  allTime={stats.bookmarks.allTime}
                  last24h={stats.bookmarks.last24h}
                  icon={Bookmark}
                />
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.users.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Registered</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Leaderboards
          </h2>
          {topLists ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LeaderboardTable title="Pastes by Views" rows={topLists.pastesByViews} type="paste" sortBy="views" />
                <LeaderboardTable
                  title="Pastes by Bookmarks"
                  rows={topLists.pastesByBookmarks}
                  type="paste"
                  sortBy="bookmarks"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LeaderboardTable title="Images by Views" rows={topLists.imagesByViews} type="image" sortBy="views" />
                <LeaderboardTable
                  title="Images by Bookmarks"
                  rows={topLists.imagesByBookmarks}
                  type="image"
                  sortBy="bookmarks"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LeaderboardTable title="Albums by Views" rows={topLists.albumsByViews} type="album" sortBy="views" />
                <LeaderboardTable
                  title="Albums by Bookmarks"
                  rows={topLists.albumsByBookmarks}
                  type="album"
                  sortBy="bookmarks"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading leaderboards...</span>
            </div>
          )}
        </section>

        {token && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Your Bookmarks
            </h2>

            {!bookmarks ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading bookmarks...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {bookmarks.pastes && bookmarks.pastes.length > 0 && (
                  <div>
                    <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pastes ({bookmarks.pastes.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookmarks.pastes.map((paste) => (
                        <BookmarkItem key={paste.slug} item={paste} type="paste" />
                      ))}
                    </div>
                  </div>
                )}

                {bookmarks.images && bookmarks.images.length > 0 && (
                  <div>
                    <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Images ({bookmarks.images.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookmarks.images.map((image) => (
                        <BookmarkItem key={image._id} item={image} type="image" />
                      ))}
                    </div>
                  </div>
                )}

                {bookmarks.albums && bookmarks.albums.length > 0 && (
                  <div>
                    <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Albums ({bookmarks.albums.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookmarks.albums.map((album) => (
                        <BookmarkItem key={album._id} item={album} type="album" />
                      ))}
                    </div>
                  </div>
                )}

                {!bookmarks.pastes?.length && !bookmarks.images?.length && !bookmarks.albums?.length && (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No bookmarks yet. Start bookmarking content!
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </section>
        )}

        {!token && (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-8 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Sign in to view your bookmarks</p>
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import FeedItemCard from "./FeedItemCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Clock, Eye, Heart, Search, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", icon: Clock },
  { value: "views", label: "Views", icon: Eye },
  { value: "bookmark", label: "Favourites", icon: Heart },
]

export default function PasteFeed() {
  const API_BASE = `${BACKEND_URL}/paste`
  const SEARCH_API = `${BACKEND_URL}/paste/search`

  const [pastes, setPastes] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [sort, setSort] = useState("newest")

  // Fetch list paste mặc định
  const loadPastes = (sortOption = sort) => {
    setLoading(true)
    fetch(`${API_BASE}?sort=${sortOption}`)
      .then((res) => res.json())
      .then((json) => setPastes(json))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPastes()
  }, [])

  // Handle search
  const handleSearch = async () => {
    // Nếu không nhập gì → load lại feed gốc
    if (!query.trim()) {
      loadPastes()
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`)
      const json = await res.json()
      setPastes(json)
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setSearching(false)
    }
  }

  const currentSort = SORT_OPTIONS.find((opt) => opt.value === sort)

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pastes by content..."
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="sr-only">Search</span>
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0 bg-transparent">
              {currentSort && <currentSort.icon className="h-4 w-4" />}
              Sort by: {currentSort?.label}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  setSort(option.value)
                  loadPastes(option.value)
                }}
                className="gap-2"
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {pastes.length === 0 && <p className="text-muted-foreground text-center py-8">No results found.</p>}

      {pastes.map((p) => (
        <FeedItemCard key={p.slug} type="paste" item={p} />
      ))}
    </div>
  )
}

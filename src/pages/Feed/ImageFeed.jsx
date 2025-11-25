"use client"

import { useEffect, useState } from "react"
import FeedItemCard from "./FeedItemCard"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Clock, Eye, Heart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", icon: Clock },
  { value: "views", label: "Views", icon: Eye },
  { value: "bookmark", label: "Favourites", icon: Heart },
]

export default function ImageFeed() {
  const API_BASE = `${BACKEND_URL}/api/images`

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState("newest")

  const loadImages = (sortOption = sort) => {
    setLoading(true)

    fetch(`${API_BASE}?sort=${sortOption}`)
      .then((res) => res.json())
      .then((json) => setData(json.images || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadImages()
  }, [])

  const currentSort = SORT_OPTIONS.find((opt) => opt.value === sort)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
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
                  loadImages(option.value)
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

      {/* IMAGE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((img) => (
          <FeedItemCard key={img._id} type="image" item={img} />
        ))}
      </div>
    </div>
  )
}

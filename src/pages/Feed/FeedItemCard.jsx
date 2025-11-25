import { Eye, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function FeedItemCard({ type, item }) {
  if (type === "image") {
    return (
      <a href={`i/image/${item.slug}`} className="block group">
        <Card className="overflow-hidden transition-shadow hover:shadow-lg">
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.slug || "Image"}
            className="w-full h-52 object-cover"
          />
          <CardContent className="p-3">
            <p className="font-medium truncate text-foreground">{item.slug || "No caption"}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {item.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {item.bookmarks || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </a>
    )
  }

  if (type === "paste") {
    return (
      <a href={`/i/${item.slug}`} className="block group">
        <Card className="p-4 transition-shadow hover:shadow-lg">
          <h3 className="font-semibold text-lg truncate text-foreground">{item.title || "Untitled Paste"}</h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-3">{item.content}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {item.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {item.bookmarks || 0}
            </span>
          </div>
        </Card>
      </a>
    )
  }

  return null
}

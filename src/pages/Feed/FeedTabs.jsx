"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, FileText } from "lucide-react"

export default function FeedTabs({ tab, setTab }) {
  return (
    <Tabs value={tab} onValueChange={setTab} className="mb-6">
      <TabsList className="grid w-full max-w-xs grid-cols-2">
        <TabsTrigger value="images" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Images
        </TabsTrigger>
        <TabsTrigger value="pastes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Pastes
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

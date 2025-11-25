"use client"

// pages/FeedPage.jsx
import { useState } from "react"
import FeedTabs from "./FeedTabs"
import ImageFeed from "./ImageFeed"
import PasteFeed from "./PasteFeed"

export default function FeedPage() {
  const [tab, setTab] = useState("images")

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">

      <FeedTabs tab={tab} setTab={setTab} />

      {tab === "images" && <ImageFeed />}
      {tab === "pastes" && <PasteFeed />}
    </div>
  )
}

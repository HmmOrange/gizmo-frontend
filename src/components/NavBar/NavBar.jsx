"use client"

import { useContext } from "react"
import { useNavigate } from "react-router-dom"
import "../../styles.css"
import { AuthContext } from "../../context/AuthContext"
import { Navbar01 } from "@/components/ui/shadcn-io/navbar-01"

export default function NavBar() {
  const navigate = useNavigate()
  const { user, logout } = useContext(AuthContext)

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const handleNotificationClick = () => {
    console.log("Notifications clicked")
    // Add your notification logic here
  }

  return (
    <div className="relative w-full">
      <Navbar01
        user={user}
        onLogout={handleLogout}
        onNotificationClick={handleNotificationClick}
        hasNotifications={true}
      />
    </div>
  )
}

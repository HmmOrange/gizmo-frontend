"use client"
import AppRoutes from "@/routes/AppRoutes"
import AuthProvider from "@/context/AuthContext"
import { Toaster } from "react-hot-toast"

export default function Page() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

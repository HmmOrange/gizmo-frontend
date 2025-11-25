import { BrowserRouter, Routes, Route } from "react-router-dom"
import NavBar from "../components/NavBar/NavBar"
import Footer from "../components/Footer/footer"
import { useLocation } from "react-router-dom"

import Landing from "../pages/Landing/Landing"
import Login from "../pages/Login/Login.jsx"
import SignUp from "../pages/SignUp/SignUp.jsx"
import CreatePaste from "../pages/CreatePaste/CreatePaste.jsx"
import SharePaste from "../pages/CreatePaste/SharePaste.jsx"
import EditPaste from "../pages/CreatePaste/EditPaste.jsx"
import CreateImage from "../pages/CreateImage/CreateImage.jsx"
import ShareImage from "../pages/CreateImage/ShareImage.jsx"
import ShareAlbum from "../pages/CreateImage/ShareAlbum.jsx"
import AuthCallback from "../pages/AuthCallBack/AuthCallback.jsx"
import Profile from "../pages/Profile/Profile.jsx"
import MyPastes from "../pages/Pastes/MyPastes.jsx"
import Gallery from "../pages/Gallery/Gallery.jsx"
import FeedPage from "../pages/Feed/FeedPage.jsx"
import Dashboard from "../pages/Dashboard/Dashboard.jsx"

function AppContent() {
  const location = useLocation()

  const hideFooter = location.pathname === "/login" || location.pathname === "/signup"

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/i/:id" element={<SharePaste />} />
        <Route path="/create/paste" element={<CreatePaste />} />
        <Route path="/edit/:id" element={<EditPaste />} />
        <Route path="/create/image" element={<CreateImage />} />
        <Route path="/i/image/:slug" element={<ShareImage />} />
        <Route path="/i/album/:slug" element={<ShareAlbum />} />
        <Route path="/auth/success" element={<AuthCallback />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mypastes" element={<MyPastes />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

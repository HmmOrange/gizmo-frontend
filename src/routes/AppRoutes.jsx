import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login.jsx";
import SignUp from "../pages/SignUp/SignUp.jsx";
import CreatePaste from "../pages/CreatePaste/CreatePaste.jsx";
import SharePaste from "../pages/CreatePaste/SharePaste.jsx";
import EditPaste from "../pages/CreatePaste/EditPaste.jsx";
import CreateImage from "../pages/CreateImage/CreateImage.jsx";
import ShareImage from "../pages/CreateImage/ShareImage.jsx";
import AuthCallback from "../pages/AuthCallBack/AuthCallback.jsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/share/:id" element={<SharePaste />} />
        <Route path="/create/paste" element={<CreatePaste />} />
        <Route path="/edit/:id" element={<EditPaste />} />
        <Route path="/create/image" element={<CreateImage />} />
        <Route path="/share/image/:slug" element={<ShareImage />} />
        <Route path="/auth/success" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  );
}
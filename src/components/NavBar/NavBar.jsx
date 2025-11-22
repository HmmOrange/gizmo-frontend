import React, { useContext } from 'react';
import { useNavigate } from "react-router-dom";
import '../../styles.css';
import { AuthContext } from "../../context/AuthContext";
import { Navbar01 } from '@/components/ui/shadcn-io/navbar-01';

export default function NavBar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="relative w-full">
    <Navbar01 />
  </div>
  );
}

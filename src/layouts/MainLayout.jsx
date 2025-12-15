import React from "react";
import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/Global/Navbar";
import ScrollToTop from "../components/utils/ScrollToTop";
import FloatingLoginButton from "../components/Global/FloatingLoginButton";
import FloatingAdminButton from "../components/Global/FloatingAdminButton";

const MainLayout = () => {
  return (
    <div>
          <Navbar/>
          <ScrollToTop/>
          <main><Outlet/></main>
          <FloatingLoginButton/>
          <FloatingAdminButton/>
    </div>
  );
};

export default MainLayout;

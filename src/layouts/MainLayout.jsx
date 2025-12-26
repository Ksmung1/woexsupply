import React from "react";
import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/Global/Navbar";
import ScrollToTop from "../components/utils/ScrollToTop";
import FloatingLoginButton from "../components/Global/FloatingLoginButton";
import Shortcut from "../components/Global/Shortcut";

const MainLayout = () => {
  return (
    <div>
      <Navbar />
      <ScrollToTop />
      <main>
        <Outlet />
      </main>
      <FloatingLoginButton />
      <Shortcut />
      <div className="h-20"></div>
    </div>
  );
};

export default MainLayout;

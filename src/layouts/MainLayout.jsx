import React from "react";
import { Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Global/Navbar";
import ScrollToTop from "../components/utils/ScrollToTop";
import FloatingLoginButton from "../components/Global/FloatingLoginButton";
import FloatingAdminButton from "../components/Global/FloatingAdminButton";
import Shortcut from "../components/Global/Shortcut";

const MainLayout = () => {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? "bg-gray-900" : "bg-white"
      }`}
    >
      <Navbar />
      <ScrollToTop />
      <main
        className={`transition-colors ${isDark ? "bg-gray-900" : "bg-white"}`}
      >
        <Outlet />
      </main>
      <FloatingLoginButton />
      <FloatingAdminButton />
      <Shortcut />
      <div className="h-20"></div>
    </div>
  );
};

export default MainLayout;

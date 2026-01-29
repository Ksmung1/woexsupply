import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { db } from "../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Global/Navbar";
import ScrollToTop from "../components/utils/ScrollToTop";
import FloatingLoginButton from "../components/Global/FloatingLoginButton";
import FloatingAdminButton from "../components/Global/FloatingAdminButton";
import Shortcut from "../components/Global/Shortcut";
import Footer from "../components/Global/Footer";

const MainLayout = () => {
  const { isDark } = useTheme();
  const [maintenance, setMaintenance] = useState(false);
  useEffect(() => {
    const ref = doc(db, "settings", "website");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setMaintenance(!!snap.data().maintenance);
        } else {
          setMaintenance(false);
        }
      },
      () => setMaintenance(false)
    );

    return () => unsub();
  }, []);

  return (
    <div
      className={`min-h-screen-dvh transition-colors ${
        isDark ? "bg-gray-900" : "bg-white"
      }`}
    >
      <Navbar />
      {maintenance && (
        <div className="w-full bg-red-500">
          <p className="w-fit mx-auto font-semibold text-white"> Website under Maintenance Mode</p>
        </div>
      )}
      <ScrollToTop />
      <main
        className={`transition-colors ${isDark ? "bg-gray-900" : "bg-white"} safe-bottom`}
      >
        <Outlet />
      </main>

      <FloatingLoginButton />
      <FloatingAdminButton />
      <Shortcut />
      <div className="h-20 safe-bottom"></div>
    </div>
  );
};

export default MainLayout;

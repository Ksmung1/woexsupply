import React from "react";
import { Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Navbar from "../components/Global/Navbar";
import ScrollToTop from "../components/utils/ScrollToTop";
import FloatingLoginButton from "../components/Global/FloatingLoginButton";
import FloatingAdminButton from "../components/Global/FloatingAdminButton";
import Shortcut from "../components/Global/Shortcut";
import LoadingPage from "../components/Global/LoadingPage";

const MainLayout = () => {
  const { loading } = useUser();

  // Show loading page until user data is fetched from DB
  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <Navbar />
      <ScrollToTop />
      <main>
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

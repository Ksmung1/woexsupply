import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Global ScrollToTop component — scrolls to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null; // no UI needed
};

export default ScrollToTop;

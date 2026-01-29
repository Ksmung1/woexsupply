import React, { createContext, useState, useEffect, useContext } from "react";

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Initialize theme state and apply immediately
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem("theme");
    let shouldBeDark;
    
    if (stored) {
      shouldBeDark = stored === "dark";
    } else {
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    
    // Apply theme immediately (synchronously) before React renders
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      document.body.style.backgroundColor = "#111827"; // gray-900
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      document.body.style.backgroundColor = "#ffffff"; // white
    }
    
    return shouldBeDark;
  });

  useEffect(() => {
    // Update document class, body background, and localStorage when theme changes
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      document.body.style.backgroundColor = "#111827"; // gray-900
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      document.body.style.backgroundColor = "#ffffff"; // white
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// Helper function to get classes based on dark mode
export const getThemeClasses = (isDark, lightClass, darkClass) => {
  return isDark ? darkClass : lightClass;
};

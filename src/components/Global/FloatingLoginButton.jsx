import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { auth, db } from "../../config/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FaGoogle, FaTimes } from "react-icons/fa";

const provider = new GoogleAuthProvider();

const FloatingLoginButton = () => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if user is logged in
  if (user) return null;

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      if (!firebaseUser) throw new Error("No user received from Google.");

      // Basic user object to store
      const userData = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        provider: "google",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      // Ensure there's a user doc (create if missing)
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, userData, { merge: true });
      } else {
        // update lastLogin (non-blocking)
        try {
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        } catch (e) {
          console.warn("Could not update lastLogin:", e);
        }
      }

      // Close expanded state on success
      setIsExpanded(false);
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(
        err?.message ||
          "An error occurred while signing in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed fixed-bottom-safe right-6 md:bottom-6 md:right-6 z-50" style={{ bottom: "calc(1.5rem + var(--safe-bottom))" }}>
      {isExpanded ? (
        // Expanded card view
        <div className={`rounded-2xl shadow-2xl p-6 max-w-sm w-[320px] border animate-in slide-in-from-bottom-4 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Sign In</h3>
            <button
              onClick={() => {
                setIsExpanded(false);
                setError("");
              }}
              className={`p-1 rounded-full transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              aria-label="Close"
            >
              <FaTimes className={isDark ? "text-gray-400" : "text-gray-500"} size={16} />
            </button>
          </div>

          <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Sign in with Google to access your account, orders, and wallet.
          </p>

          {error && (
            <div className={`mb-4 text-sm p-3 rounded-lg border ${isDark ? "text-red-400 bg-red-900/30 border-red-800" : "text-red-700 bg-red-50 border-red-200"}`}>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
              loading
                ? `opacity-70 cursor-wait ${isDark ? "bg-gray-700" : "bg-gray-100"}`
                : isDark
                ? "bg-gray-800 border-2 border-gray-600 hover:border-purple-400 hover:bg-purple-900/30"
                : "bg-white border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50"
            }`}
          >
            <FaGoogle className="text-xl" />
            <span className={isDark ? "text-white" : "text-gray-900"}>
              {loading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          <p className={`mt-4 text-xs text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      ) : (
        // Floating button
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center gap-3 group"
          aria-label="Sign In"
        >
          <FaGoogle className="text-xl" />
          <span className="hidden sm:inline-block font-semibold pr-2">
            Sign In
          </span>
        </button>
      )}
    </div>
  );
};

export default FloatingLoginButton;

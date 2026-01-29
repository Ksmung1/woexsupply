import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FaExclamationCircle } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const provider = new GoogleAuthProvider();

export default function Authentication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const {isDark} = useTheme()

  const handleGoogle = async () => {
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
        // Add other fields you want as defaults
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      // Ensure there's a user doc (create if missing)
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, userData, { merge: true });
        // If you want to set additional subcollections or defaults, do it here
      } else {
        // update lastLogin (non-blocking)
        try {
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        } catch (e) {
          // ignore non-fatal write error
          console.warn("Could not update lastLogin:", e);
        }
      }

      // success — navigate or close modal
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(
        err?.message ||
          "An error occurred while signing in. Please try again or use a different method."
      );
    } finally {
      setLoading(false);
    }
  };

return (
  <div
    className={`min-h-screen-dvh flex items-center justify-center p-4 ${
      isDark ? "bg-gray-950" : "bg-gray-50"
    }`}
  >
    <div className="w-full max-w-md">

      {/* Card */}
      <div
        className={`rounded-2xl shadow-xl border ${
          isDark
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-200"
        }`}
      >

        {/* Header */}
        <div
          className={`px-6 py-8 text-center border-b ${
            isDark ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <h1
            className={`text-3xl font-bold ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Woex Supply
          </h1>
          <p
            className={`mt-1 text-sm ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Welcome back
          </p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <h2
            className={`text-2xl font-semibold mb-2 ${
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Sign In
          </h2>

          <p
            className={`mb-6 text-sm leading-relaxed ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Continue with Google to sign in. If this Google account hasn’t been
            used before, a new account will be created automatically.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 flex gap-3 rounded-lg border border-red-900 bg-red-950/40 p-4">
              <FaExclamationCircle className="text-red-500 mt-1" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  Sign In Error
                </p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium border transition ${
              loading
                ? "cursor-wait opacity-70"
                : isDark
                ? "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span className="w-5 h-5">{/* Google SVG */}</span>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Terms */}
          <div
            className={`mt-6 pt-6 text-xs text-center border-t ${
              isDark ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"
            }`}
          >
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-purple-500 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-purple-500 hover:underline">
              Privacy Policy
            </a>.
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        className={`mt-6 text-center text-sm ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Need help?{" "}
        <a href="/contact" className="text-purple-500 hover:underline">
          Contact Support
        </a>
      </p>
    </div>
  </div>
);

}

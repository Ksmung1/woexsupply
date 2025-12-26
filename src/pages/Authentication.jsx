import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FaExclamationCircle } from "react-icons/fa";

const provider = new GoogleAuthProvider();

export default function Authentication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Woex Supply</h1>
            <p className="text-purple-100 text-sm md:text-base">Welcome back!</p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In</h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
        Continue with Google to sign in. If this Google account hasn't been used here before,
        a new account will be created automatically. You can always edit your profile later.
      </p>
            </div>

            {/* Error Message */}
      {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                <FaExclamationCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 mb-1">Sign In Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
      )}

            {/* Google Sign In Button */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        aria-label="Continue with Google"
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                loading
                  ? "opacity-70 cursor-wait bg-gray-100 text-gray-600"
                  : "bg-white border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 text-gray-900"
        }`}
      >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span className="w-5 h-5 flex-shrink-0">
          <svg viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M533.5 278.4c0-18.7-1.6-37-4.9-54.8H272v103.8h147.3c-6.3 33.9-25.5 62.6-54.4 81.7v67.8h87.8C501.3 427.4 533.5 355.6 533.5 278.4z" fill="#4285f4"/>
            <path d="M272 544.3c73.6 0 135.4-24.4 180.6-66.2l-87.8-67.8c-24.4 16.3-55.7 25.9-92.8 25.9-71 0-131.2-47.9-152.7-112.1H31.7v70.6C76.8 487.6 168.6 544.3 272 544.3z" fill="#34a853"/>
            <path d="M119.3 325.9c-10.8-32.3-10.8-66.9 0-99.2V156.1H31.7C11.3 197.7 0 241.1 0 278.4s11.3 80.7 31.7 122.3l87.6-74.8z" fill="#fbbc04"/>
            <path d="M272 109.5c39.9 0 76 13.7 104.3 40.6l78.2-78.2C402.9 23.2 344.5 0 272 0 168.6 0 76.8 56.7 31.7 156.1l87.6 70.6C140.9 157.4 201 109.5 272 109.5z" fill="#ea4335"/>
          </svg>
        </span>
                  <span>Continue with Google</span>
                </>
              )}
      </button>

            {/* Terms */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-purple-600 hover:text-purple-700 underline font-medium">
          Terms of Service
                </a>{" "}
        and{" "}
                <a href="/privacy" className="text-purple-600 hover:text-purple-700 underline font-medium">
          Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a href="/contact" className="text-purple-600 hover:text-purple-700 font-medium">
              Contact Support
            </a>
        </p>
        </div>
      </div>
    </div>
  );
}

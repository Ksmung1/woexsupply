import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  // optionally you might want signInWithCredential for other flows
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
    <div className="max-w-md mx-auto my-12 p-6 mt-50 bg-white justify-center rounded-xl shadow-md">
      <h1 className="text-xl font-semibold mb-3">Woex Supply</h1>

      <p className="text-sm text-gray-600 mb-4">
        Continue with Google to sign in. If this Google account hasn't been used here before,
        a new account will be created automatically. You can always edit your profile later.
      </p>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>
      )}

      <button
        onClick={handleGoogle}
        disabled={loading}
        aria-label="Continue with Google"
        className={`w-full flex items-center justify-center gap-3 px-4 py-2 rounded-md border hover:shadow-sm transition ${
          loading ? "opacity-70 cursor-wait" : "bg-white"
        }`}
      >
        {/* Google logo SVG */}
        <span className="w-6 h-6">
          <svg viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M533.5 278.4c0-18.7-1.6-37-4.9-54.8H272v103.8h147.3c-6.3 33.9-25.5 62.6-54.4 81.7v67.8h87.8C501.3 427.4 533.5 355.6 533.5 278.4z" fill="#4285f4"/>
            <path d="M272 544.3c73.6 0 135.4-24.4 180.6-66.2l-87.8-67.8c-24.4 16.3-55.7 25.9-92.8 25.9-71 0-131.2-47.9-152.7-112.1H31.7v70.6C76.8 487.6 168.6 544.3 272 544.3z" fill="#34a853"/>
            <path d="M119.3 325.9c-10.8-32.3-10.8-66.9 0-99.2V156.1H31.7C11.3 197.7 0 241.1 0 278.4s11.3 80.7 31.7 122.3l87.6-74.8z" fill="#fbbc04"/>
            <path d="M272 109.5c39.9 0 76 13.7 104.3 40.6l78.2-78.2C402.9 23.2 344.5 0 272 0 168.6 0 76.8 56.7 31.7 156.1l87.6 70.6C140.9 157.4 201 109.5 272 109.5z" fill="#ea4335"/>
          </svg>
        </span>

        <span className="text-sm font-medium text-gray-900">
          {loading ? "Signing in…" : "Continue with Google"}
        </span>
      </button>

      <div className="mt-4 text-xs flex gap-1 text-gray-500">
        By continuing you accept our{" "}
        <p className="underline">
          Terms of Service
        </p>{" "}
        and{" "}
        <p className="underline">
          Privacy Policy
        </p>
        .
      </div>
    </div>
  );
}

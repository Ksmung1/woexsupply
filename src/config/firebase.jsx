import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
const app = initializeApp(firebaseConfig);

// Enable IndexedDB persistence via initializeFirestore
// Use the new cache config style:
const db = initializeFirestore(app, {
  localCache: {
    // You can specify cacheSizeBytes here:
    cacheSizeBytes: CACHE_SIZE_UNLIMITED // or a number like 40 * 1024 * 1024 for 40MB
  }
});
const auth = getAuth(app);
const storage = getStorage(app);

export { auth, db, storage };

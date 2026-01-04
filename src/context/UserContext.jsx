import React, { createContext, useState, useEffect, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc = () => {};
    setLoading(true);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        try {
          const snapshot = await getDoc(userDocRef);
          if (snapshot.exists()) {
            const userData = snapshot.data();
            setIsAdmin(userData.role === "admin");
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            // fallback if user doc missing
            const fallback = { uid: currentUser.uid };
            setIsAdmin(false);
            setUser(fallback);
            localStorage.setItem("user", JSON.stringify(fallback));
          }
        } catch (err) {
          console.error("Error fetching user document:", err);
        } finally {
          setLoading(false);
        }

        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const liveUserData = snap.data();
              setUser(liveUserData);
              setIsAdmin(liveUserData.role === "admin");
              localStorage.setItem("user", JSON.stringify(liveUserData));
            }
          },
          (error) => console.error("Live user update error:", error)
        );
      } else {
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem("user");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

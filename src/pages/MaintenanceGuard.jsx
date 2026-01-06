import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useUser } from "../context/UserContext";
import LoadingPage from "../components/Global/LoadingPage";
import { useLocation, Navigate } from "react-router-dom";

const MaintenanceGuard = ({ children }) => {
  const { user, loading, isAdmin } = useUser();
  const [maintenance, setMaintenance] = useState(null);
  const location = useLocation();

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

  // Still resolving auth or maintenance state
  if (loading || maintenance === null) {
    return <LoadingPage />;
  }

  // 🚧 Maintenance ON → block non-admins
  if (maintenance && !isAdmin) {
    return <Navigate to="/maintenance" replace state={{ from: location }} />;
  }

  return children;
};

export default MaintenanceGuard;

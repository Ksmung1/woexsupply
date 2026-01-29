// RechargeForm.jsx (wrapper)
import React from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";

import RechargeFormZone from "./RechargeFormZone";     // your zone-based component
import RechargeFormRegion from "./RechargeFormRegion"; // your region-based component

// GAME CONFIG (same as you had)
const GAME_CONFIG = {
  "/recharge/mlbb": { product: "mobilelegends", productId: "13", storageKey: "ml_prev_data", type: 'useridandzoneid' },
  "/recharge/mcgg": { product: "magicchessgogo", productId: "23837", storageKey: "mc_prev_data", type: 'useridandzoneid' },
  "/recharge/supersus": { product: "supersus", productId: "3088", storageKey: "ss_prev_data", type: 'useridandzoneid' },
  "/recharge/bloodstrike": { product: "bloodstrike", productId: "20294", storageKey: "bs_prev_data", type: 'useridandzoneid' },
  "/recharge/hsr": { product: "hsr", productId: "hsr", storageKey: "hsr_prev_data", type: 'userid|server' },
  "/recharge/gi": { product: "gi", productId: "gi", storageKey: "gi_prev_data", type: 'userid|server' },
};

const DEFAULT_CONFIG = { product: "mobilelegends", productId: "13", storageKey: "ml_prev_data", type: 'useridandzoneid' };

/**
 * Wrapper RechargeForm
 * Props expected (shared between both child components):
 * - userId, setUserId, zoneId, setZoneId, username, setUsername, usernameExists, setUsernameExists
 */
const RechargeForm = (props) => {
  const {
    userId,
    setUserId,
    zoneId,
    setZoneId,
    username,
    setUsername,
    usernameExists,
    setUsernameExists,
  } = props;

  const location = useLocation();
  const { user } = useUser();

  const config = GAME_CONFIG[location.pathname] || DEFAULT_CONFIG;

  // Choose which component to render but pass THE SAME props to both.
  // This keeps your existing children unchanged — region variant will still receive zoneId/setZoneId.
  if (config.type === "useridandzoneid") {
    return (
      <RechargeFormZone
        userId={userId}
        setUserId={setUserId}
        zoneId={zoneId}
        setZoneId={setZoneId}
        username={username}
        setUsername={setUsername}
        usernameExists={usernameExists}
        setUsernameExists={setUsernameExists}
        config={config}
        user={user}
      />
    );
  }

  // For region-style games we still pass zoneId/setZoneId (as you requested)
  return (
    <RechargeFormRegion
      userId={userId}
      setUserId={setUserId}
      zoneId={zoneId}         // region component will receive this prop (use it as region if you want)
      setZoneId={setZoneId}   // setter still works the same
      username={username}
      setUsername={setUsername}
      usernameExists={usernameExists}
      setUsernameExists={setUsernameExists}
      config={config}
      user={user}
    />
  );
};

export default RechargeForm;

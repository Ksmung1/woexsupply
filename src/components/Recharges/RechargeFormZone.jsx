// RechargeFormZone.jsx
import React, { useEffect, useState } from "react";
import { RefreshCw, Info } from "lucide-react";
import { checkUsername } from "../utils/checkUsername";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";

/**
 * Props expected:
 * - userId, setUserId
 * - zoneId, setZoneId
 * - username, setUsername
 * - usernameExists, setUsernameExists
 *
 * Also receives `config` from wrapper (product, productId, storageKey, type)
 */

const RechargeFormZone = ({
  userId, setUserId,
  zoneId, setZoneId,
  username, setUsername,
  usernameExists, setUsernameExists,
  config
}) => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [hasPrevData, setHasPrevData] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isReseller = user?.role === "reseller";

  useEffect(() => {
    const stored = localStorage.getItem(config.storageKey);
    if (stored) setHasPrevData(true);
  }, [config.storageKey]);

  useEffect(() => {
    if (usernameExists === false) {
      setUserId("");
      setZoneId("");
      setUsername("");
      setModalMessage("");
      setShowModal(false);
      setLoading(false);
      setCooldown(0);
    }
  }, [usernameExists, setUserId, setZoneId, setUsername]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const resetResults = () => {
    setUsername("");
    setModalMessage("");
    setShowModal(false);
    setCooldown(0);
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").trim();
    resetResults();

    const paren = pasted.match(/^(\d+)\s*\((\d+)\)$/);
    if (paren) {
      e.preventDefault();
      setUserId(paren[1]);
      setZoneId(paren[2]);
      return;
    }

    const parts = pasted.split(/[\s-]+/);
    if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      e.preventDefault();
      setUserId(parts[0]);
      setZoneId(parts[1]);
      return;
    }

    const digits = pasted.replace(/\D/g, "");
    if (digits.length > 5) {
      e.preventDefault();
      setUserId(digits);
      setZoneId("");
    }
  };

  const handleNumberInput = (e, setter) => {
    const value = e.target.value.replace(/\D/g, "");
    resetResults();
    setter(value);
  };

  const fetchLastId = () => {
    const saved = JSON.parse(localStorage.getItem(config.storageKey) || "null");
    if (saved) {
      setUserId(saved.userId || "");
      setZoneId(saved.zoneId || "");
    } else {
      setModalMessage("No previously saved ID found.");
      setShowModal(true);
    }
  };

  const handleInfoClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2500);
  };

  const handleClick = async () => {
    if (cooldown > 0 && !isReseller) {
      setModalMessage(`Please wait ${Math.ceil(cooldown / 60)} minutes.`);
      setShowModal(true);
      return;
    }

    if (!userId || !zoneId) {
      setModalMessage("Missing User ID or Server ID.");
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      setUsernameExists(true);

      const result = await checkUsername({
        userid: userId,
        zoneid: zoneId,
        product: config.product,
        productid: config.productId,
      });

      if (result.success) {
        setUsername(result.username);
        localStorage.setItem(config.storageKey, JSON.stringify({
          userId, zoneId, username: result.username, region: result.region || ""
        }));
      } else {
        setModalMessage(result.message || "Failed to fetch username.");
        setUsername("");
        setShowModal(true);
      }

      if (!isReseller) setCooldown(5 * 60);
    } catch (err) {
      setModalMessage("Something went wrong.");
      setUsername("");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 p-3 shadow-md rounded-xl w-full text-[13px] border ${isDark ? "bg-black text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Order Info</p>

        {hasPrevData && !userId && !zoneId && (
          <div className="flex items-center gap-1">
            <button onClick={fetchLastId} className="p-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
              <RefreshCw className="h-3 w-3" />
            </button>

            <div className="relative">
              <button onClick={handleInfoClick} className="p-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white">
                <Info className="h-3 w-3" />
              </button>

              {showTooltip && (
                <div className={`absolute top-full right-0 mt-1 py-1 px-2 text-[11px] border shadow-sm rounded-md animate-fadeInOut whitespace-nowrap ${isDark ? "bg-black text-white border-gray-700" : "bg-white text-black border-gray-300"}`}>
                  Load previous ID
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        value={userId}
        onChange={(e) => handleNumberInput(e, setUserId)}
        onPaste={handlePaste}
        type="text"
        placeholder="User ID"
        maxLength={20}
        className={`text-center w-full p-2 rounded-lg text-[13px] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-300 border ${isDark ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"}`}
      />

      <input
        value={zoneId}
        onChange={(e) => handleNumberInput(e, setZoneId)}
        onPaste={handlePaste}
        type="text"
        placeholder="Server ID"
        maxLength={10}
        className={`text-center w-full p-2 rounded-lg text-[13px] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-300 border ${isDark ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"}`}
      />

      <button
        onClick={handleClick}
        disabled={loading || (cooldown > 0 && !isReseller)}
        className={`w-full py-2 rounded-lg text-white text-[13px] font-medium shadow-sm transition ${loading || (cooldown > 0 && !isReseller) ? "bg-purple-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"}`}
        dangerouslySetInnerHTML={{ __html: loading ? "Checking..." : username ? `✔ ${username}` : "Check Username" }}
      />

      {username && (
        <div className={`w-full p-2 mt-1 rounded-lg shadow-sm text-[12px] space-y-1 border ${isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-gray-50 border-gray-300 text-gray-900"}`}>
          <p><strong>ID:</strong> {userId}</p>
          <p><strong>Server:</strong> {zoneId}</p>
          <p><strong>Name:</strong> {username}</p>
        </div>
      )}

      {showModal && (
        <div className="w-full bg-red-50 border border-red-400 text-red-700 rounded-md p-2 flex justify-between items-center text-[12px] shadow-sm">
          <span dangerouslySetInnerHTML={{ __html: modalMessage }} />
          <button onClick={() => setShowModal(false)} className="font-bold px-2 py-1 rounded hover:bg-red-100">✕</button>
        </div>
      )}
    </div>
  );
};

export default RechargeFormZone;

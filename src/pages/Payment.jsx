import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAlert } from "../context/AlertContext";
import { useModal } from "../context/ModalContext";
import logo from "../assets/images/logoPayment.jpg";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const POLL_INTERVAL = 4000;          // 4 seconds
const PAYMENT_TIMEOUT_MINUTES = 10;
const PAYMENT_TIMEOUT_MS = PAYMENT_TIMEOUT_MINUTES * 60 * 1000;

const Payment = () => {
  const [searchParams] = useSearchParams();
  const countdownStartedRef = useRef(false);

  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { showSuccess, showError } = useAlert();
  const { openModal } = useModal();
  const pollingActiveRef = useRef(true);

  const type = searchParams.get("type") || "topup";
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");

  const [orderData, setOrderData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loading, setLoading] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(PAYMENT_TIMEOUT_MINUTES * 60);

  const successHandledRef = useRef(false);
  const failureHandledRef = useRef(false);
  const countdownRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!orderId) {
      showError("No order ID found");
      setTimeout(() => navigate("/"), 1800);
      return;
    }

    const collectionName =
      type === "game" ? "orders" :
      type === "manual" ? "queues" :
      type === "account" ? "gameAccounts" :
      "topups";

    const orderRef = doc(db, collectionName, orderId);

    console.log(`[PAYMENT] Monitoring started → ${collectionName}/${orderId}`);

    // ── Real-time listener ────────────────────────────────────────
    const unsubscribe = onSnapshot(orderRef, (snap) => {
      if (!snap.exists()) {
        console.warn("[PAYMENT] Document not found");
        setLoading(false);
        showError("Order not found");
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      const data = { id: snap.id, ...snap.data() };
      setOrderData(data);
      setLoading(false);
      // Start countdown ONCE when createdAt arrives
if (
  data.createdAt &&
  !countdownStartedRef.current &&
  !successHandledRef.current &&
  !failureHandledRef.current
) {
  countdownStartedRef.current = true;

  const createdAtDate = data.createdAt.toDate();
  console.log(
    "[PAYMENT] Starting countdown from createdAt:",
    createdAtDate.toISOString()
  );

  startCountdown(createdAtDate.getTime());
}


      const newStatus = data.status || "pending";
      console.log(`[FIRESTORE] Status → ${newStatus}`, {
        status: newStatus,
        paymentReceived: data.paymentReceived,
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
      });

      setStatus(newStatus);

      // Success cases
      if (
        (newStatus === "success" || newStatus === "completed" ||
          (type === "manual" && data.paymentReceived === true)) &&
        !successHandledRef.current
      ) {
        successHandledRef.current = true;
        pollingActiveRef.current = false;
if (pollRef.current) {
  clearTimeout(pollRef.current);
  pollRef.current = null;
}

        console.log("[PAYMENT] ✅ SUCCESS detected");
        handleSuccess(data);
        stopCountdown();
      }

      if (newStatus === "failed" && !failureHandledRef.current) {
        pollingActiveRef.current = false;
        if (pollRef.current) {
          clearTimeout(pollRef.current);
          pollRef.current = null;
        }
      
        failureHandledRef.current = true;
        showError("Payment was not successful.");
        stopCountdown();
      }
      
    }, (err) => {
      console.error("[FIRESTORE] Snapshot error:", err);
      showError("Failed to listen to order updates");
    });

    // ── Countdown logic (sync with createdAt timestamp) ──────────
    const startCountdown = (startTimeMs) => {
      if (countdownRef.current) clearInterval(countdownRef.current);

      countdownRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTimeMs;
        const remainingMs = Math.max(0, PAYMENT_TIMEOUT_MS - elapsed);
        const seconds = Math.floor(remainingMs / 1000);

        setRemainingSeconds(seconds);

        if (seconds <= 0 && !successHandledRef.current && !failureHandledRef.current) {
          pollingActiveRef.current = false;
          if (pollRef.current) {
            clearTimeout(pollRef.current);
            pollRef.current = null;
          }
        
          showError("Payment session has expired");
          stopCountdown();
        }
        
      }, 900); // slightly less than 1s to avoid drift
    };

    const stopCountdown = () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        console.log("[PAYMENT] Countdown stopped");
      }
    };

    const pollStatus = async () => {
      if (!pollingActiveRef.current) {
        return;
      }
    
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const res = await axios.post(`${backendUrl}/payment/check-status`, {
          order_id: orderId,
          type,
        });
    
        console.log("[POLL] Response:", res.data);
    
        const bs = res.data?.status;
    
        if (bs === "success" || bs === "completed") {
          pollingActiveRef.current = false;
          successHandledRef.current = true;
          handleSuccess({ ...orderData, status: bs });
          stopCountdown();
          return;
        }
    
        if (bs === "failed") {
          pollingActiveRef.current = false;
          failureHandledRef.current = true;
          showError("Payment was not successful.");
          stopCountdown();
          return;
        }
      } catch (err) {
        console.warn("[POLL] Failed:", err.message);
      }
    
      // schedule next poll ONLY if still active
      if (pollingActiveRef.current) {
        pollRef.current = setTimeout(pollStatus, POLL_INTERVAL);
      }
    };
    

    pollingActiveRef.current = true;
    pollRef.current = setTimeout(pollStatus, 4000);
    



    return () => {
      console.log("[PAYMENT] Cleaning up...");
      unsubscribe();
      pollingActiveRef.current = false;
      if (pollRef.current) clearTimeout(pollRef.current);
            stopCountdown();
    };
  }, [orderId, type]); // ← important: depend on createdAt

  const handleSuccess = (data) => {
    let message = "";
    if (type === "manual") {
      message = "Payment received! An admin will process your order shortly.";
    } else if (type === "game") {
      message = "Payment successful! Your game top-up is being processed.";
    } else {
      message = "Payment successful! Your wallet has been topped up.";
    }

    showSuccess(message);

    setTimeout(() => {
      if (type === "game") navigate("/orders");
      else if (type === "manual") navigate("/queues");
      else if (type === "account") navigate("/accounts");
      else navigate("/wallet");
    }, 2600);
  };

  const openUpiIntent = () => {
    if (orderData?.intentLink) {
      window.location.href = orderData.intentLink;
    }
  };

  const handleCancel = () => {
    if (!orderId) return;

    openModal({
      title: "Cancel Payment",
      content: "Are you sure you want to cancel this payment? This action cannot be undone.",
      type: "confirm",
      onConfirm: async () => {
        try {
          const collectionName =
            type === "game"
              ? "orders"
              : type === "manual"
              ? "queues"
              : type === "account"
              ? "gameAccounts"
              : "topups";

          const orderRef = doc(db, collectionName, orderId);
          await updateDoc(orderRef, {
            status: "failed",
            paymentReceived: false,
          });

          showError("Payment Cancelled");
          setTimeout(() => navigate("/"), 1000);
        } catch (err) {
          console.error("Error cancelling order:", err);
          showError("Failed to cancel order");
        }
      },
    });
  };

  // ── UI helpers ─────────────────────────────────────────────────────
  const isSuccess =
    status === "success" ||
    status === "completed" ||
    (type === "manual" && orderData?.paymentReceived);

  const isFailed = status === "failed";

  const getMainIcon = () => {
    if (loading) return <FaSpinner className="text-6xl text-purple-600 animate-spin" />;
    if (isSuccess) return <FaCheckCircle className="text-6xl text-green-500" />;
    if (isFailed) return <FaTimesCircle className="text-6xl text-red-500" />;
    return <FaSpinner className="text-6xl text-indigo-500 animate-spin" />;
  };

  const getTitle = () => {
    if (loading) return "Loading...";
    if (isSuccess) return "Payment Successful!";
    if (isFailed) return "Payment Failed";
    if (type === "manual" && orderData?.paymentReceived) return "Payment Received!";
    return "Waiting for Payment...";
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (loading && !orderData) {
    return (
      <div className="min-h-screen-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50/40">
        <div className="text-center">
          {getMainIcon()}
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen-dvh flex items-center justify-center px-4 ${
        isDark ? "bg-zinc-900" : "bg-zinc-100"
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-2xl shadow-xl border overflow-hidden ${
          isDark ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200"
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 text-center border-b ${
            isDark ? "border-zinc-700" : "border-zinc-200"
          }`}
        >
          <h1
            className={`text-xl font-semibold ${
              isDark ? "text-zinc-100" : "text-zinc-800"
            }`}
          >
            Checking Payment Status...
          </h1>
          {!isSuccess && !isFailed && (
            <p className={`mt-1 text-sm font-medium ${
              remainingSeconds <= 60 ? "text-red-500" : "text-indigo-500"
            }`}>
              Time remaining: {Math.floor(remainingSeconds / 60)}:
              {(remainingSeconds % 60).toString().padStart(2, "0")}
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div
          className={`rounded-xl border p-4 text-left space-y-2 mx-4 mt-4 ${
            isDark ? "bg-zinc-900 border-zinc-700" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <div className="flex justify-between text-sm">
            <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>Order ID</span>
            <span className={`font-mono text-xs ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
              {orderData?.id}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className={isDark ? "text-zinc-300" : "text-zinc-600"}>Type</span>
            <span className={`capitalize font-medium ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
              {type}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700">
            <span className={`font-medium ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
              Total Amount
            </span>
            <span className="text-xl font-bold text-indigo-600">
              ₹{orderData?.cost || orderData?.amount || "—"}
            </span>
          </div>
        </div>

        {/* QR Section */}
        {orderData && !isSuccess && !isFailed && (
          <div className="p-6 text-center space-y-4">
            {/* Brand */}
            <div
              className={`flex items-center justify-center gap-2 font-semibold ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            >
              <img
                className="w-10 h-10 rounded-full border border-zinc-500"
                src={logo}
                alt="WOEX"
              />
              <span>WOEX SUPPLY</span>
            </div>

            {orderData.qrCode && (
              <div className="mx-auto w-56 h-56 bg-white rounded-xl p-3 shadow-inner">
                <img
                  src={orderData.qrCode}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className={`text-2xl font-bold ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>
              ₹{orderData.cost || orderData.amount || "—"}
            </div>

            {orderData.intentLink && (
              <button
                onClick={openUpiIntent}
                className="w-full bg-[#00B9F1] hover:bg-[#009fd9] text-white font-semibold py-3 rounded-xl transition"
              >
                Pay using Paytm
              </button>
            )}

            <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              Works with Paytm, Google Pay, PhonePe, BHIM
            </p>

            <button
              onClick={handleCancel}
              className="text-red-500 text-sm font-medium underline hover:text-red-600 transition"
            >
              Cancel Payment
            </button>
          </div>
        )}

        {/* Success / Failed */}
        {(isSuccess || isFailed) && (
          <div className="p-8 text-center space-y-4">
            {getMainIcon()}
            <h2
              className={`text-xl font-semibold ${
                isDark ? "text-zinc-100" : "text-zinc-800"
              }`}
            >
              {getTitle()}
            </h2>
          </div>
        )}

        {/* Footer */}
        <div
          className={`p-4 border-t ${
            isDark ? "bg-zinc-900 border-zinc-700" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          {isSuccess ? (
            <button
              onClick={() => navigate(type === "game" ? "/orders" : "/wallet")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition"
            >
              Continue
            </button>
          ) : isFailed ? (
            <button
              onClick={() => navigate("/")}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition"
            >
              Go Home
            </button>
          ) : (
            <button
              onClick={() => navigate("/")}
              className={`w-full py-3 rounded-xl font-medium transition ${
                isDark ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-100" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
              }`}
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;

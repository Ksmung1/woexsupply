import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAlert } from "../context/AlertContext";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaWallet,
  FaGamepad,
} from "react-icons/fa";
import logo from "../assets/images/logo.png";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {isDark} = useTheme()
  const { showSuccess, showError } = useAlert();

  const type = searchParams.get("type") || "topup";
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");

  const [orderData, setOrderData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loading, setLoading] = useState(true);

  const successHandledRef = useRef(false);
  const failureHandledRef = useRef(false);

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  useEffect(() => {
    if (!orderId) {
      showError("No order ID found");
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    const collectionName =
      type === "game"
        ? "orders"
        : type === "manual"
        ? "queues"
        : type === "account"
        ? "gameAccounts"
        : "topups";

    const orderRef = doc(db, collectionName, orderId);

    // ── Real-time listener ── is the main control flow
    const unsubscribe = onSnapshot(
      orderRef,
      (snap) => {
        if (!snap.exists()) {
          setLoading(false);
          showError("Order not found");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        const data = {
          id: snap.id,
          ...snap.data(),
        };

        setOrderData(data);
        setLoading(false);

        const newStatus = data.status || "pending";
        const prevStatus = status;

        // Debug log for status transitions
        if (prevStatus !== "loading" && prevStatus !== newStatus) {
          console.log(
            `%c[Payment] Status changed: ${prevStatus} → ${newStatus}`,
            "background:#222;color:#bada55;padding:2px 6px;border-radius:4px"
          );
        }

        setStatus(newStatus);

        // ── SUCCESS / COMPLETED ───────────────────────────────
        if (
          (newStatus === "success" || newStatus === "completed") &&
          !successHandledRef.current
        ) {
          successHandledRef.current = true;
          handleSuccess(data);
        }

        // ── MANUAL PAYMENT RECEIVED (even if status = pending) ──
        else if (
          type === "manual" &&
          data.paymentReceived === true &&
          !successHandledRef.current
        ) {
          successHandledRef.current = true;
          handleSuccess(data);
        }

        // ── FAILED ─────────────────────────────────────────────
        else if (newStatus === "failed" && !failureHandledRef.current) {
          failureHandledRef.current = true;
          showError("Payment was not successful.");
        }
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        showError("Failed to listen to order updates");
        setLoading(false);
      }
    );

    // Initial quick check (optional fallback)
    const initialCheck = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const res = await axios.post(`${backendUrl}/payment/check-status`, {
          order_id: orderId,
          type,
        });

        if (
          res.data?.status === "success" ||
          res.data?.status === "completed"
        ) {
          // If backend already knows it's successful → force success
          if (!successHandledRef.current) {
            successHandledRef.current = true;
            handleSuccess({ ...orderData, status: "success" });
          }
        }
      } catch (err) {
        // silent fail — we trust snapshot more anyway
      }
    };

    // Give snapshot a chance first, then fallback check after 2s
    const timeout = setTimeout(initialCheck, 2200);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
      successHandledRef.current = false;
      failureHandledRef.current = false;
    };
  }, [orderId, type, navigate, showSuccess, showError]);

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
    }, 2800);
  };

  const openUpiIntent = () => {
    if (orderData?.intentLink) {
      window.location.href = orderData.intentLink;
    }
  };

  // ── RENDER HELPERS ────────────────────────────────────────
  const isSuccess =
    status === "success" ||
    status === "completed" ||
    (type === "manual" && orderData?.paymentReceived);

  const isFailed = status === "failed";

  const getMainIcon = () => {
    if (loading)
      return <FaSpinner className="text-6xl text-purple-600 animate-spin" />;
    if (isSuccess) return <FaCheckCircle className="text-6xl text-green-500" />;
    if (isFailed) return <FaTimesCircle className="text-6xl text-red-500" />;
    return <FaSpinner className="text-6xl text-indigo-500 animate-spin" />;
  };

  const getTitle = () => {
    if (loading) return "Loading...";
    if (isSuccess) return "Payment Successful!";
    if (isFailed) return "Payment Failed";
    if (type === "manual" && orderData?.paymentReceived)
      return "Payment Received!";
    return "Waiting for Payment...";
  };

  if (loading && !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50/40">
        <div className="text-center">
          {getMainIcon()}
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 ${
        isDark ? "bg-zinc-900" : "bg-zinc-100"
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-2xl shadow-xl border overflow-hidden ${
          isDark
            ? "bg-zinc-800 border-zinc-700"
            : "bg-white border-zinc-200"
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
          <p
            className={`mt-1 text-sm ${
              isDark ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            Scan QR Code to Pay
          </p>
        </div>
  
        {/* QR Section */}
        {orderData && !isSuccess && !isFailed && (
          <div className="p-6 text-center space-y-3">
            {/* Brand */}
            <div
              className={`flex items-center justify-center gap-2 font-semibold ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            >
              <img
                className="w-10 h-10 rounded-full border border-zinc-500"
                src="https://scontent.fshl2-1.fna.fbcdn.net/v/t39.30808-6/475967196_122137310864552129_4890777849722756121_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=ixCLQHPNTVEQ7kNvwHdnCJ8&_nc_oc=AdkBtfLhQkCJXxpu_pCoZrw3OKI4NGJKCyA5xdHShIumxoffM_lQ8XxsgZrYBcfkK4WvRSbxx5uQc_9x2dYj9Cn0&_nc_zt=23&_nc_ht=scontent.fshl2-1.fna&_nc_gid=6NhihHRAbn19IBWEX7otkw&oh=00_Afo1bxagya9NZoaQOqo9WMMIGFc_yW8hZ5GWhGKh2BE_fQ&oe=69714C9E"
                alt="WOEX"
              />
              <span>WOEX SUPPLY</span>
            </div>
  
            {/* QR */}
            {orderData.qrCode && (
              <div className="mx-auto w-56 h-56 bg-white rounded-xl p-3 shadow-inner">
                <img
                  src={orderData.qrCode}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
  
            {/* Amount */}
            <div
              className={`text-lg font-bold ${
                isDark ? "text-zinc-100" : "text-zinc-800"
              }`}
            >
              ₹{orderData.cost || orderData.amount || "--"}
            </div>
  
            {/* Paytm Button */}
            {orderData.intentLink && (
              <button
                onClick={openUpiIntent}
                className="w-full bg-[#00B9F1] hover:bg-[#009fd9] text-white font-semibold py-3 rounded-xl transition"
              >
                Pay using Paytm
              </button>
            )}
  
            <p
              className={`text-xs ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Works with Paytm, Google Pay, PhonePe, BHIM
            </p>
          </div>
        )}
  
        {/* Success / Failed */}
        {(isSuccess || isFailed) && (
          <div className="p-6 text-center space-y-4">
            {getMainIcon()}
            <h2
              className={`text-lg font-semibold ${
                isDark ? "text-zinc-100" : "text-zinc-800"
              }`}
            >
              {getTitle()}
            </h2>
          </div>
        )}
  
        {/* Footer Buttons */}
        <div
          className={`p-4 border-t ${
            isDark
              ? "bg-zinc-900 border-zinc-700"
              : "bg-zinc-50 border-zinc-200"
          }`}
        >
          {isSuccess ? (
            <button
              onClick={() =>
                navigate(type === "game" ? "/orders" : "/wallet")
              }
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
                isDark
                  ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
                  : "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
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

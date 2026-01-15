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

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 py-6 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header / Status */}
        <div className="p-4 text-center ">
          {getMainIcon()}
          <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-800">
            {getTitle()}
          </h1>
        </div>

        {/* QR / Payment Instructions */}
        {orderData && !isSuccess && !isFailed && (
          <div className="p-4">
            {orderData.qrCode && (
              <div className="text-center">
                <p className="text-lg font-semibold mb-3">Scan to Pay</p>
                <div className="inline-block p-3 bg-white rounded-xl shadow-inner ">
                  <img
                    src={orderData.qrCode}
                    alt="UPI QR Code"
                    className="w-52 h-52 object-contain mx-auto"
                  />
                </div>

                <div className="mt-4 text-xl font-bold text-indigo-700">
                  ₹{orderData.cost || orderData.amount || "?.??"}
                </div>

                {isMobile && orderData.intentLink && (
                  <button
                    onClick={openUpiIntent}
                    className="mt-5 w-full bg-[#00B9F1] hover:bg-[#009fd9] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 shadow-md transition"
                  >
                    {/* <img
                      src="https://upload.wikimedia.org/wikipedia/commons/5/55/Paytm_logo.png"
                      className="h-6"
                      alt="Paytm"
                    /> */}
                    Pay with Paytm App
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Order Summary */}
        {orderData && (
          <div className="p-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID</span>
              <span className="font-mono font-medium">{orderData.id}</span>
            </div>

            {orderData.amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold">₹{orderData.amount}</span>
              </div>
            )}
            {orderData.cost && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold">₹{orderData.cost}</span>
              </div>
            )}

            {orderData.item && (
              <div className="flex justify-between">
                <span className="text-gray-600">Item</span>
                <span>{orderData.item}</span>
              </div>
            )}

            {orderData.utr && (
              <div className="flex justify-between">
                <span className="text-gray-600">UTR</span>
                <span className="font-mono">{orderData.utr}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-4">
          {isSuccess ? (
            <>
              <button
                onClick={() =>
                  navigate(type === "game" ? "/orders" : "/wallet")
                }
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:brightness-105 transition"
              >
                {type === "game" ? "View Orders" : "Go to Wallet"}
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-gray-200 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Home
              </button>
            </>
          ) : isFailed ? (
            <>
              <button
                onClick={() =>
                  navigate(type === "game" ? "/recharge" : "/wallet")
                }
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-gray-200 py-3 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Home
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-medium transition"
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

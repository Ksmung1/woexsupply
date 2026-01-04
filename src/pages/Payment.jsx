import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useUser } from "../context/UserContext";
import { useAlert } from "../context/AlertContext";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaWallet,
  FaGamepad,
  FaCopy,
} from "react-icons/fa";
import axios from "axios";

/* ---------------- helpers ---------------- */
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

const extractUpiFromUpiString = (upiString) => {
  if (!upiString) return null;
  try {
    const decoded = decodeURIComponent(upiString);
    const match = decoded.match(/pa=([^&]+)/i);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
};

const generateTr = () =>
  `ORD${Date.now()}${Math.floor(Math.random() * 100000)}`;

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { showSuccess, showError } = useAlert();

  const type = searchParams.get("type") || "topup";
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");

  const [orderData, setOrderData] = useState(null);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [checkingCount, setCheckingCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const maxChecks = 60;
  const intervalRef = useRef(null);
  const countRef = useRef(0);
  const successHandledRef = useRef(false);
  const [tr] = useState(generateTr);

  /* ---------------- fetch order ---------------- */
  useEffect(() => {
    if (!orderId) {
      showError("No order ID found in URL");
      navigate("/");
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

    const fetchOrder = async () => {
      try {
        const docSnap = await getDoc(orderRef);
        if (!docSnap.exists()) {
          showError("Order not found");
          navigate("/");
          return;
        }

        const data = docSnap.data();
        setOrderData(data);
        setStatus(data.status || "pending");
        setLoading(false);

        if (
          data.status === "success" ||
          data.status === "completed" ||
          data.status === "closed"
        ) {
          handleSuccess();
        } else {
          startStatusCheck(data);
        }
      } catch (error) {
        console.error(error);
        showError("Failed to load order details");
        setLoading(false);
      }
    };

    fetchOrder();

    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      setOrderData(data);

      if (data.status !== status) {
        setStatus(data.status);

        if (
          (data.status === "success" || data.status === "completed") &&
          !successHandledRef.current
        ) {
          successHandledRef.current = true;
          clearInterval(intervalRef.current);
          handleSuccess();
        }
      }
    });

    return () => {
      unsubscribe();
      clearInterval(intervalRef.current);
    };
  }, [orderId, type]);

  /* ---------------- polling ---------------- */
  const startStatusCheck = (data) => {
    clearInterval(intervalRef.current);
    countRef.current = 0;
    setCheckingCount(0);
    setStatus("checking");

    intervalRef.current = setInterval(async () => {
      countRef.current++;
      setCheckingCount(countRef.current);

      if (countRef.current >= maxChecks) {
        clearInterval(intervalRef.current);
        setStatus("pending");
        return;
      }

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await axios.post(
          `${backendUrl}/payment/check-status`,
          { order_id: orderId, type }
        );

        if (
          (response.data.status === "success" ||
            response.data.status === "completed") &&
          !successHandledRef.current
        ) {
          successHandledRef.current = true;
          clearInterval(intervalRef.current);
          handleSuccess();
        }

        if (response.data.status === "failed") {
          clearInterval(intervalRef.current);
          setStatus("failed");
        }
      } catch (err) {
        console.error("Status check error:", err);
      }
    }, 10000);
  };

  /* ---------------- success ---------------- */
  const handleSuccess = () => {
    showSuccess("Payment successful!");

    setTimeout(() => {
      if (type === "game") navigate("/orders");
      else if (type === "manual") navigate("/queues");
      else if (type === "account") navigate("/accounts");
      else navigate("/wallet");
    }, 1000);
  };

  /* ---------------- intent (FIXED) ---------------- */
  const resolvedUpi = extractUpiFromUpiString(orderData?.upiString);

  const openUpiIntent = () => {
    if (!resolvedUpi || !orderData?.amount) {
      showError("UPI app payment not available. Please scan the QR code.");
      return;
    }

    const upiIntent = `upi://pay?pa=${encodeURIComponent(
      resolvedUpi
    )}&pn=${encodeURIComponent(
      orderData.merchantName || "Merchant"
    )}&am=${orderData.amount}&cu=INR&tn=${encodeURIComponent(
      "Order " + tr
    )}&tr=${tr}`;

    window.location.href = upiIntent;
  };

  /* ---------------- UI helpers ---------------- */
  const getStatusText = () => {
    switch (status) {
      case "success":
      case "completed":
        return "Payment Successful!";
      case "failed":
        return "Payment Failed";
      case "checking":
        return "Checking Payment Status...";
      default:
        return "Payment Pending";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="text-6xl animate-spin text-purple-600" />
      </div>
    );
  }

  /* ---------------- render ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-5">
          <h1 className="text-2xl font-bold text-center mb-4">
            {getStatusText()}
          </h1>

          {orderData?.qrCode &&
            (status === "pending" || status === "checking") && (
              <div className="text-center border-t pt-6">
                <img
                  src={orderData.qrCode}
                  alt="UPI QR Code"
                  className="w-44 mx-auto"
                />

                <p className="mt-3 text-lg font-bold">
                  ₹{orderData.amount}
                </p>

                {isMobile && resolvedUpi && (
                  <button
                    onClick={openUpiIntent}
                    className="mt-4 w-64 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
                  >
                    Pay with UPI Apps
                  </button>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Works with Paytm, Google Pay, PhonePe, BHIM
                </p>
              </div>
            )}

          {status === "checking" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Checking payment status... ({checkingCount}/{maxChecks})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;

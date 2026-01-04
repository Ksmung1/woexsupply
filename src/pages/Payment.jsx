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

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { showSuccess, showError } = useAlert();
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const type = searchParams.get("type") || "topup"; // "topup" or "game" or "manual"
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");

  
  const [orderData, setOrderData] = useState(null);
  const [status, setStatus] = useState("pending"); // pending, success, failed, checking
  const [loading, setLoading] = useState(true);
  const [checkingCount, setCheckingCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const maxChecks = 60; // Check for 10 minutes (60 * 10 seconds)
  const intervalRef = useRef(null);
  const countRef = useRef(0);
  const successHandledRef = useRef(false); // Track if success has already been handled

  useEffect(() => {
    if (!orderId) {
      showError("No order ID found in URL");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    // Determine collection based on type
    const collectionName =
      type === "game"
        ? "orders"
        : type === "manual"
        ? "queues"
        : type === "account"
        ? "gameAccounts"
        : "topups";
    const orderRef = doc(db, collectionName, orderId);

    // Initial fetch
    const fetchOrder = async () => {
      try {
        const docSnap = await getDoc(orderRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrderData(data);
          setStatus(data.status || "pending");
          setLoading(false);

          // If already successful, show success
          if (
            data.status === "success" ||
            data.status === "completed" ||
            data.status === "closed"
          ) {
            handleSuccess(data);
          } else if (data.status === "failed") {
            setStatus("failed");
          } else {
            // Start checking payment status with synced count
            startStatusCheck(data);
          }
        } else {
          showError("Order not found");
          setLoading(false);
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        showError("Failed to load order details");
        setLoading(false);
      }
    };

    fetchOrder();

    // Real-time listener for order updates
    const unsubscribe = onSnapshot(
      orderRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newStatus = data.status || "pending";

          console.log(
            `[Payment] Firestore update for ${orderId}: status=${newStatus}, current status=${status}`
          );

          setOrderData(data);

          if (newStatus !== status) {
            console.log(
              `[Payment] Status changed from ${status} to ${newStatus} for ${orderId}`
            );
            setStatus(newStatus);

            if (newStatus === "success" || newStatus === "completed") {
              // Clear interval if payment succeeded
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              console.log(`[Payment] ✅ Payment successful, redirecting...`);
              // Only handle success once to prevent duplicate alerts
              if (!successHandledRef.current) {
                successHandledRef.current = true;
                handleSuccess(data);
              }
            } else if (newStatus === "failed") {
              // Clear interval if payment failed
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              setStatus("failed");
            } else if (newStatus === "pending" && status === "checking") {
              // If status changed back to pending, restart check with synced count
              startStatusCheck(data);
            }
          }
        }
      },
      (error) => {
        console.error(
          `[Payment] Firestore listener error for ${orderId}:`,
          error
        );
      }
    );

    return () => {
      unsubscribe();
      // Clean up interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, type]);

  const startStatusCheck = (orderDataParam) => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Use passed orderData or current state
    const dataToUse = orderDataParam || orderData;

    // Calculate elapsed time since order creation
    let initialCount = 0;
    if (dataToUse?.createdAt) {
      let createdAt = null;

      // Handle Firestore Timestamp
      if (dataToUse.createdAt?.toDate) {
        createdAt = dataToUse.createdAt.toDate();
      } else if (dataToUse.createdAt?.toMillis) {
        createdAt = new Date(dataToUse.createdAt.toMillis());
      } else if (dataToUse.createdAt instanceof Date) {
        createdAt = dataToUse.createdAt;
      } else if (typeof dataToUse.createdAt === "number") {
        createdAt = new Date(dataToUse.createdAt);
      }

      if (createdAt && !isNaN(createdAt.getTime())) {
        const now = new Date();
        const elapsedSeconds = Math.floor((now - createdAt) / 1000);
        // Each check happens every 10 seconds
        initialCount = Math.floor(elapsedSeconds / 10);
        // Cap at maxChecks
        initialCount = Math.min(initialCount, maxChecks);
      }
    }

    // Set initial count based on elapsed time
    countRef.current = initialCount;
    setCheckingCount(initialCount);
    setStatus("checking");

    // If we've already exceeded max checks, don't start interval
    if (initialCount >= maxChecks) {
      setStatus("pending");
      return;
    }

    intervalRef.current = setInterval(async () => {
      countRef.current += 1;
      const currentCount = countRef.current;

      setCheckingCount(currentCount);

      if (currentCount >= maxChecks) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setStatus("pending");
        return;
      }

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await axios.post(
          `${backendUrl}/payment/check-status`,
          {
            order_id: orderId,
            type: type,
          }
        );

        console.log(
          `[Payment] Status check response for ${orderId}:`,
          response.data
        );

        if (
          response.data.status === "success" ||
          response.data.status === "completed"
        ) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setStatus("completed");
          // Only handle success once to prevent duplicate alerts
          if (!successHandledRef.current) {
            successHandledRef.current = true;
            if (response.data.orderData) {
              setOrderData(response.data.orderData);
              handleSuccess(response.data.orderData);
            } else {
              // If orderData not in response, trigger success anyway
              handleSuccess(orderData);
            }
          }
        } else if (response.data.status === "failed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setStatus("failed");
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    }, 10000); // Check every 10 seconds
  };

  const handleSuccess = (data) => {
    showSuccess(
      type === "game"
        ? "Payment successful! Your game topup is being processed."
        : "Payment successful! Your wallet has been topped up."
    );

    // Redirect after 3 seconds
    setTimeout(() => {
      if (type === "game") {
        navigate("/orders");
      } else if (type === "manual") {
        navigate("/queues");
      } else if (type === "account") {
        navigate("/accounts");
      } else {
        navigate("/wallet");
      }
    }, 1000);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
      case "completed":
        return <FaCheckCircle className="text-6xl text-green-500" />;
      case "failed":
        return <FaTimesCircle className="text-6xl text-red-500" />;
      case "checking":
        return <FaSpinner className="text-6xl text-purple-600 animate-spin" />;
      default:
        return <FaSpinner className="text-6xl text-gray-400 animate-spin" />;
    }
  };

  const openPaytm = () => {
    if (!orderData?.merchantUPI || !orderData?.amount) return;
  
    const intent = `paytmmp://pay?pa=${encodeURIComponent(
      orderData.merchantUPI
    )}&pn=${encodeURIComponent(
      orderData.merchantName || "Merchant"
    )}&am=${orderData.amount}&cu=INR&tn=${encodeURIComponent(
      "Order " + orderId
    )}&tr=${orderId}`;
  
    window.location.href = intent;
  };
  

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

  const getStatusDescription = () => {
    switch (status) {
      case "success":
      case "completed":
        return type === "game"
          ? "Your game topup order has been processed successfully. You will receive your items shortly."
          : "Your wallet has been topped up successfully. You can now use your balance for purchases.";
      case "failed":
        return "Your payment could not be processed. Please try again or contact support if the issue persists.";
      case "checking":
        return "We're verifying your payment. This may take a few moments.";
      default:
        return "Scan the QR code below to complete your payment.";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-6xl text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 py-8">
      <div className="max-w-3xl shadow-black/20 border-gray-200 border shadow-2xl mx-auto px-4 md:px-6 lg:px-6">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5">
          {/* Status Icon and Text */}
          <div className="text-center mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {getStatusText()}
            </h1>
          </div>

{/* QR Code Display (for pending payments) */}
{orderData &&
  (status === "pending" || status === "checking") &&
  orderData.qrCode && (
    <div className="border-t border-gray-200 pt-6 mb-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Scan QR Code to Pay
        </h3>

        <div className="inline-block p-2 bg-white rounded-xl shadow-lg border-2 border-gray-200">
          <img
            src={orderData.qrCode}
            alt="UPI QR Code"
            className="w-44 h-44 mx-auto"
          />
        </div>

        {orderData.amount && (
          <p className="mt-4 text-lg font-bold text-gray-800">
            Amount: ₹{orderData.amount}
          </p>
        )}

{/* Official Paytm Intent Button */}
{isMobile && orderData?.merchantUPI && (
  <div className="mt-4 w-full mx-auto flex justify-center">
    <button
      onClick={openPaytm}
      className="w-50 flex items-center justify-center gap-2 bg-[#00baf2] hover:bg-[#00a1d6] text-white font-semibold py-3 rounded-lg transition"
    >
      <img
        src="https://tse1.mm.bing.net/th/id/OIP.4Czaum8sTdcx4p5gytXDMQHaEK?pid=Api&P=0&h=180"
        alt="Paytm"
        className="h-5"
      />
      Pay with Paytm
    </button>
  </div>
)}


        {!isMobile && (
          <p className="mt-4 text-sm text-gray-500">
            Open this page on your phone to pay using Paytm or UPI apps
          </p>
        )}
      </div>
    </div>
  )}


          {/* Order Details */}
          {orderData && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 font-medium">Order ID:</span>
                <span className="text-gray-900 font-semibold">
                  {orderData.id || orderId}
                </span>
              </div>

              {orderData.amount && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Amount:</span>
                  <span className="text-gray-900 font-semibold">
                    ₹{orderData.amount}
                  </span>
                </div>
              )}

              {orderData.item && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Item:</span>
                  <span className="text-gray-900 font-semibold">
                    {orderData.item}
                  </span>
                </div>
              )}

              {orderData.date && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Date:</span>
                  <span className="text-gray-900 font-semibold">
                    {orderData.date} {orderData.time && `at ${orderData.time}`}
                  </span>
                </div>
              )}

              {orderData.status && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <span
                    className={`font-semibold ${
                      orderData.status === "success" ||
                      orderData.status === "completed"
                        ? "text-green-600"
                        : orderData.status === "failed"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {orderData.status.toUpperCase()}
                  </span>
                </div>
              )}

              {orderData.utr && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">
                    Transaction ID:
                  </span>
                  <span className="text-gray-900 font-semibold font-mono text-sm">
                    {orderData.utr}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {status === "success" || status === "completed" ? (
              <>
                <button
                  onClick={() =>
                    navigate(type === "game" ? "/orders" : "/wallet")
                  }
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {type === "game" ? (
                    <>
                      <FaGamepad /> View Orders
                    </>
                  ) : (
                    <>
                      <FaWallet /> Go to Wallet
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Back to Home
                </button>
              </>
            ) : status === "failed" ? (
              <>
                <button
                  onClick={() =>
                    navigate(type === "game" ? "/recharge" : "/wallet")
                  }
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Back to Home
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Back to Home
              </button>
            )}
          </div>

          {/* Checking Progress */}
          {status === "checking" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Checking payment status... ({checkingCount}/{maxChecks})
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(checkingCount / maxChecks) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;

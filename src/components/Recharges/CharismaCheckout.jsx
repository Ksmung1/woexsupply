import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext";
import { useAlert } from "../../context/AlertContext";
import { db } from "../../config/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  arrayUnion,
  setDoc,
} from "firebase/firestore";
import coin from "../../assets/images/topup.png";
import upi from "../../assets/images/upi.png";
import AddPhoneNumber from "../modal/AddPhoneNumber";
import axios from "axios";

const CharismaCheckout = ({
  selectedItem,
  setSelectedItem,
  userId,
  setUserId,
  zoneId,
  setZoneId,
  username,
  setUsername,
  usernameExists,
  setUsernameExists,
}) => {
  const { user } = useUser();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isSelectedPayment, setIsSelectedPayment] = useState("upi");
  const [isDisabled, setIsDisabled] = useState(false);
  const { showAlert } = useAlert();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const balance = user?.balance || 0;
  const parsedBalance = parseFloat(balance);

  const getParsedAmount = () => {
    if (!selectedItem) return 0;
    if (user?.role === "reseller" || user?.role === "prime")
      return selectedItem.resellerRupees || selectedItem.rupees;
    if (user?.role === "vip") return Math.round(selectedItem.rupees * 0.97);
    return selectedItem.rupees;
  };

  const parsedAmount = getParsedAmount();

  function getLocalISOString() {
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, "0");
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timeString = `${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    const dateString = `${pad(now.getDate())}-${pad(
      now.getMonth() + 1
    )}-${now.getFullYear()}`;
    return `${dateString}T${timeString}`;
  }

  const fullDateTime = getLocalISOString();
  const [datePart, timePart] = fullDateTime.split("T");

  function generateRandomOrderId(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let orderId = "CHARISMA-";
    for (let i = 0; i < length; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderId;
  }

  const [newOrderId] = useState(generateRandomOrderId());

  useEffect(() => {
    if (selectedItem) {
      const el = document.getElementById("form");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedItem]);

  const resetForm = () => {
    setSelectedItem(null);
    setIsSelectedPayment("coin");
    setUserId("");
    setZoneId("");
    setUsername("");
    setUsernameExists(false);
  };

  // === UPI PAYMENT ===
  const handleUpi = async () => {
    if (!username) {
      showAlert("Please check username first");
      return;
    }

    const orderData = {
      id: newOrderId,
      userId,
      zoneId,
      uid: user.uid,
      product: "charisma",
      productId: selectedItem.id,
      username: user.username || user.name,
      gameUsername: username,
      cost: parsedAmount,
      date: datePart,
      time: timePart,
      item: selectedItem.label,
      selectedItem,
      payment: "upi",
      status: "pending",
      type: "manual", // Mark as charisma order
      isManual: true, // Mark as manual order - backend will create queue
    };

    try {
      showAlert("Redirecting to payment...");

      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_PAYMENT_URL;
      const gatewayRes = await axios.post(
        `${backendUrl}/payment/start-order`,
        orderData
      );

      if (gatewayRes.data.result?.result?.payment_url) {
        window.location.href = gatewayRes.data.result.result.payment_url;
      } else if (gatewayRes.data.redirect_url) {
        window.location.href = gatewayRes.data.redirect_url;
      } else {
        showAlert("Payment initialization failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      showAlert("Failed to start payment. Try again.");
    }
  };

  // === MAIN ORDER HANDLER ===
  const handleCreateOrder = async () => {
    setIsDisabled(true);

    try {
      if (!user?.phone) {
        setShowPhoneModal(true);
        setIsDisabled(false);
        return;
      }

      if (!selectedItem) {
        showAlert("Please select a product.");
        setIsDisabled(false);
        return;
      }

      if (selectedItem?.outOfStock) {
        showAlert("This product is out of stock.");
        setIsDisabled(false);
        return;
      }

      if (!username) {
        showAlert("Please check your ML username first.");
        setIsDisabled(false);
        return;
      }

      proceedToConfirm();
    } catch (err) {
      console.error(err);
      setIsDisabled(false);
    }
  };

  // === CONFIRMATION MODAL ===
  const proceedToConfirm = () => {
    openModal({
      title: "Confirm Purchase",
      content: (
        <p className="text-sm">
          Buy <strong>{selectedItem.label || selectedItem.name}</strong> for{" "}
          <strong>
            {userId}
            {zoneId && ` (${zoneId})`}
          </strong>
          <br />
          Username: <strong>{username}</strong>
          <br />
          Amount: <strong>₹{parsedAmount}</strong>
        </p>
      ),
      type: "confirm",

      onConfirm: async () => {
        // UPI ONLY REDIRECT
        if (isSelectedPayment === "upi") {
          handleUpi();
          setIsDisabled(false);
          return;
        }

        // GAMEBAR COIN
        if (parsedBalance < parsedAmount) {
          showAlert("Not enough balance.");
          setIsDisabled(false);
          return;
        }

        showAlert("Processing your order...");

        try {
          // Create manual queue directly in Firestore (no API calls)
          const queueData = {
            id: newOrderId,
            userId,
            zoneId,
            uid: user.uid,
            product: "charisma",
            productId: selectedItem.id,
            username: user.name || user.username,
            gameUsername: username,
            cost: parsedAmount,
            date: datePart,
            time: timePart,
            item: selectedItem.label,
            payment: "coin",
            status: "pending",
            type: "manual", // Mark as charisma order
            isManual: true, // Mark as manual order
            createdAt: serverTimestamp(),
          };

          // Add queue to Firestore using queue ID as document ID
          const queueRef = doc(db, "queues", newOrderId);
          await setDoc(queueRef, queueData);

          // Deduct balance from user and add queue ID to user.queue array
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const currentBalance = parseFloat(userDoc.data().balance || 0);
            await updateDoc(userRef, {
              balance: currentBalance - parsedAmount,
              queue: arrayUnion(newOrderId),
            });
          }

          showAlert(
            "Order created successfully! Admin will process it manually."
          );
          resetForm();
        } catch (err) {
          console.error("Order Error:", err);
          showAlert("Order failed. Try again.");
        }

        setIsDisabled(false);
      },

      onCancel: () => setIsDisabled(false),
    });
  };

  return (
    <>
      {showPhoneModal && (
        <AddPhoneNumber 
          onClose={() => setShowPhoneModal(false)}
          onSuccess={() => {
            setShowPhoneModal(false);
          }}
        />
      )}

      <div className="w-full flex flex-col gap-6 p-0">
        {/* PAYMENT METHOD BOX */}
        <div className="w-full border border-gray-100 dark:border-zinc-700 rounded-sm shadow-lg p-4 bg-white dark:bg-zinc-800">
          <h1 className="text-xl font-semibold mb-3 dark:text-white">Choose Payment Method</h1>

          <div className="flex flex-col gap-4">
            {["upi", "coin"].map((method) => (
              <button
                key={method}
                onClick={() => setIsSelectedPayment(method)}
                className={`relative flex items-center justify-between py-3 px-4 rounded-md transition font-medium shadow-md border ${
                  isSelectedPayment === method
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-700"
                    : "bg-white dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600 dark:text-zinc-200"
                }`}
              >
                {method === "coin" && (
                  <>
                    <div className="flex items-center gap-3">
                      <img className="w-10 h-10" src={coin} alt="Coin" />
                      <div>
                        <p className="font-semibold">Balance</p>
                        <p className="text-sm">
                          <strong className="text-green-600">
                            {user?.balance || 0}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-lg">₹{parsedAmount}</span>
                  </>
                )}

                {method === "upi" && (
                  <>
                    <div className="flex items-center gap-3">
                      <img className="h-10" src={upi} alt="UPI" />
                      <span className="font-semibold">UPI / QR</span>
                    </div>
                    <span className="font-bold text-lg">
                      ₹{Math.round(parsedAmount)}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* BUY BUTTON */}
        <div className="w-full rounded-md shadow-md p-4 bg-white dark:bg-zinc-800">
          <button
            disabled={isDisabled || selectedItem?.outOfStock}
            onClick={user ? handleCreateOrder : () => navigate("/login")}
            className={`w-full py-4 text-lg font-bold rounded-lg transition-all ${
              isDisabled || selectedItem?.outOfStock
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            }`}
          >
            {selectedItem?.outOfStock
              ? "Out of Stock"
              : user
              ? isDisabled
                ? "Processing..."
                : "Buy Now"
              : "Login to Buy"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CharismaCheckout;

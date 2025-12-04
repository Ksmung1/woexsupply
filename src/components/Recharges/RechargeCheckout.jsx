import { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext";
import { useAlert } from "../../context/AlertContext";

import coin from "../../assets/images/topup.png";
import upi from "../../assets/images/upi.png";

import OrderDetailModal from "../modal/OrderDetailModal";
import AddPhoneNumber from "../modal/AddPhoneNumber";
import axios from "axios";

const RechargeCheckout = ({
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
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [product, setProduct] = useState('')
  const { showAlert } = useAlert();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const [isSelectedPayment, setIsSelectedPayment] = useState("coin");
  const [isDisabled, setIsDisabled] = useState(false);

  const balance = user?.balance || 0;
  const parsedBalance = parseFloat(balance);

  const getParsedAmount = () => {
    if (!selectedItem) return 0;
    if (user?.role === "reseller" || user?.role === "prime")
      return selectedItem.resellerRupees;
    if (user?.role === "admin") return 1;
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
    let orderId = "MLBB-";
    for (let i = 0; i < length; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderId;
  }

  const [newOrderId, setNewOrderId] = useState(generateRandomOrderId());

  useEffect(() => {
    setNewOrderId(generateRandomOrderId());
  }, [isSelectedPayment, username]);
  const location = useLocation()
  useEffect(() => {
  if (selectedItem) {
    const el = document.getElementById("form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}, [selectedItem]);

  useEffect(() => {
    const path = location.pathname;

    if (path === "/recharge/mcgg") {
      setProduct("magicchessgogo");
    } else if (path === "/recharge/mlbb") {
      setProduct("mobilelegends");
    } else {
      setProduct(null);
    }
  }, [location.pathname]);

  const resetForm = () => {
    setSelectedItem(null);
    setIsSelectedPayment("coin");
    setNewOrderId(generateRandomOrderId());
    setOrderDetails(null);
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
      uid: user.uid,
      zoneId,
      product: product,
      productId: selectedItem.id,
      username: user.username,
      gameUsername: username,
      cost: parsedAmount,
      date: datePart,
      time: timePart,
      selectedItem,
      api: selectedItem.api,
      stockPrice: selectedItem.price
    };

    try {
      showAlert("Redirecting to payment...");
      const { data } = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/payment/start-order`,
        {
          ...orderData,
          ksmApi: import.meta.env.VITE_APP_KSM_API,
        }
      );

      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        showAlert(`Payment failed: ${data.message || "Try again"}`);
      }
    } catch (err) {
      console.error(err);
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
        showAlert("Please select a package.");
        setIsDisabled(false);
        return;
      }

      if (!username) {
        showAlert("Please check your ML username.");
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
          Buy <strong>{selectedItem.label}</strong> for{" "}
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
          const url = import.meta.env.VITE_BACKEND_URL;
          const ksmApi = import.meta.env.VITE_KSM_API_KEY
          const payload = {
            userId,
            zoneId,
            productId: selectedItem.id,
            ksmApi,
            uid: user.uid,
            cost: parsedAmount,
            date: datePart,
            time: timePart,
            item: selectedItem.label,
            payment: "coin",
            username: user.name,
            gameUsername: username,
            idtrx: newOrderId,
            api: selectedItem.api || "smile",
            product: "MLBB Recharge",
            stockPrice: selectedItem.price
          };

          const endpoint = selectedItem.api === 'smile' ?
          `${url}/smile/create-order` :
          `${url}/gamestopup/create-order`

          const { data } = await axios.post(endpoint,payload);

          if (
            data?.status === 200 &&
            data?.order_id &&
            data.order_id !== "Order Failed"
          ) {
            setOrderDetails(data.orderData);
            setShowOrderModal(true);
            setUsernameExists(false);
          } else {
            showAlert("Order failed. Try again.");
          }
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
        <AddPhoneNumber onClose={() => setShowPhoneModal(false)} />
      )}

      <div className="w-full flex flex-col gap-6 p-0">
        {/* PAYMENT METHOD BOX */}
        <div className="w-full border border-gray-100 rounded-sm shadow-lg p-4 bg-white">
          <h1 className="text-xl font-semibold mb-3">Choose Payment Method</h1>

          <div className="flex flex-col gap-4">
            {["upi", "coin"].map((method) => (
              <button
                key={method}
                onClick={() => setIsSelectedPayment(method)}
                className={`relative flex items-center justify-between py-3 px-4 rounded-md transition font-medium shadow-md border ${
                  isSelectedPayment === method
                    ? "bg-yellow-500 text-white border-yellow-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
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
        <div className="w-full rounded-md shadow-md p-4 bg-white">
          <button
            disabled={isDisabled || selectedItem?.outOfStock}
            onClick={user ? handleCreateOrder : () => navigate("/login")}
            className={`w-full py-4 text-lg font-bold rounded-lg transition-all ${
              isDisabled || selectedItem?.outOfStock
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
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

        {/* SUCCESS MODAL */}
        {showOrderModal && (
          <OrderDetailModal
            orderData={orderDetails}
            onClose={() => {
              setShowOrderModal(false);
              resetForm();
            }}
          />
        )}
      </div>
    </>
  );
};

export default RechargeCheckout;

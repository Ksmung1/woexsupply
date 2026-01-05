import { useState, useEffect } from "react";
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
  const { showAlert } = useAlert();
  const { openModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();

  /* ---------------- SCREEN SIZE MOBILE DETECTION ---------------- */
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = screenWidth <= 768;

  /* ---------------- STATES ---------------- */
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [product, setProduct] = useState(null);

  const [isSelectedPayment, setIsSelectedPayment] = useState("coin");
  const [isDisabled, setIsDisabled] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  /* ---------------- AMOUNT LOGIC ---------------- */
  const balance = parseFloat(user?.balance || 0);

  const getParsedAmount = () => {
    if (!selectedItem) return 0;
    if (user?.role === "reseller" || user?.role === "prime")
      return selectedItem.resellerRupees;
    if (user?.role === "admin") return 1;
    if (user?.role === "vip") return Math.round(selectedItem.rupees * 0.97);
    return selectedItem.rupees;
  };
  const parsedAmount = getParsedAmount();

  /* ---------------- DATE / TIME ---------------- */
  const now = new Date();
  const datePart = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
  const timePart = now.toLocaleTimeString();

  /* ---------------- ORDER ID ---------------- */
  const generateRandomOrderId = () =>
    "MLBB-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const [newOrderId, setNewOrderId] = useState(generateRandomOrderId());

  useEffect(() => {
    setNewOrderId(generateRandomOrderId());
  }, [username, isSelectedPayment]);

  /* ---------------- PRODUCT BY ROUTE ---------------- */
  useEffect(() => {
    if (location.pathname === "/recharge/mcgg") setProduct("magicchessgogo");
    else if (location.pathname === "/recharge/mlbb")
      setProduct("mobilelegends");
  }, [location.pathname]);

  /* ---------------- RESET ---------------- */
  const resetForm = () => {
    setSelectedItem(null);
    setIsSelectedPayment("coin");
    setNewOrderId(generateRandomOrderId());
    setOrderDetails(null);
    setUserId("");
    setZoneId("");
    setUsername("");
    setUsernameExists(false);
    setShowCheckoutModal(false);
  };

  /* ---------------- UPI FLOW ---------------- */
  const handleUpi = async () => {
    const payload = {
      id: newOrderId,
      userId,
      uid: user.uid,
      zoneId,
      product,
      productId: selectedItem.id,
      username: user.username,
      gameUsername: username,
      cost: parsedAmount,
      date: datePart,
      time: timePart,
      item: selectedItem.label,
      type: "game",
      api: selectedItem.api,
      stockPrice: selectedItem.price,
    };

    try {
      showAlert("Redirecting to payment...");
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const res = await axios.post(
        `${backendUrl}/payment/start-order`,
        payload
      );

      window.location.href =
        res.data.result?.result?.payment_url || res.data.redirect_url;
    } catch {
      showAlert("Failed to start payment.");
    }
  };

  /* ---------------- CONFIRM FLOW ---------------- */
  const handleCreateOrder = async () => {
    if (!user) return navigate("/login");
    if (!user.phone) return setShowPhoneModal(true);
    if (!selectedItem || !username) {
      showAlert("Please select product & confirm username.");
      return;
    }

    if (isMobile) {
      setShowCheckoutModal(true);
      return;
    }

    proceedToConfirm();
  };

  const proceedToConfirm = () => {
    openModal({
      title: "Confirm Purchase",
      content: (
        <p className="text-sm">
          <strong>{selectedItem.label}</strong>
          <br />
          Username: <strong>{username}</strong>
          <br />
          Amount: <strong>₹{parsedAmount}</strong>
        </p>
      ),
      type: "confirm",
      onConfirm: async () => {
        if (isSelectedPayment === "upi") return handleUpi();

        if (balance < parsedAmount) {
          showAlert("Not enough balance.");
          return;
        }

        showAlert("Processing order...");
      },
    });
  };

  const showBottomConfirm =
    isMobile && selectedItem && username && !showCheckoutModal;

  /* ================= RENDER ================= */
  return (
    <>
      {showPhoneModal && (
        <AddPhoneNumber onClose={() => setShowPhoneModal(false)} />
      )}

      {/* PAYMENT METHOD (DESKTOP OR MOBILE MODAL) */}
      {(!isMobile || showCheckoutModal) && (
        <div
          className={`bg-white border shadow-lg p-4 ${
            isMobile
              ? "fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
              : "mb-6"
          }`}
        >
          {isMobile && (
            <div className="flex justify-between mb-3">
              <h2 className="font-semibold text-lg">Choose Payment</h2>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-sm text-gray-500"
              >
                Close
              </button>
            </div>
          )}

          {["upi", "coin"].map((method) => (
            <button
              key={method}
              onClick={() => setIsSelectedPayment(method)}
              className={`w-full mb-3 p-4 border rounded-lg flex justify-between items-center ${
                isSelectedPayment === method
                  ? "bg-indigo-600 text-white"
                  : "bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={method === "upi" ? upi : coin}
                  className="h-8"
                />
                <span className="font-semibold">
                  {method === "upi" ? "UPI / QR" : "Wallet"}
                </span>
              </div>
              ₹{parsedAmount}
            </button>
          ))}

          <button
            onClick={proceedToConfirm}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold"
          >
            Pay ₹{parsedAmount}
          </button>
        </div>
      )}

      {/* BOTTOM CONFIRM BAR (MOBILE) */}
      {showBottomConfirm && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Ready to checkout</p>
              <p className="text-lg font-bold">₹{parsedAmount}</p>
            </div>
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {showOrderModal && (
        <OrderDetailModal
          orderData={orderDetails}
          onClose={() => {
            setShowOrderModal(false);
            resetForm();
          }}
        />
      )}
    </>
  );
};

export default RechargeCheckout;

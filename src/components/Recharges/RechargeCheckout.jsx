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

  const [isSelectedPayment, setIsSelectedPayment] = useState("upi");
  const [isDisabled, setIsDisabled] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  /* ---------------- AMOUNT LOGIC ---------------- */
  const balance = parseFloat(user?.balance || 0);

  const getParsedAmount = () => {
    if (!selectedItem) return 0;
    if (user?.role === "reseller" || user?.role === "prime")
      return selectedItem.resellerRupees;
    if (user?.role === "vip") return Math.round(selectedItem.rupees * 0.97);
    return selectedItem.rupees;
  };
  const parsedAmount = getParsedAmount();

  /* ---------------- DATE / TIME ---------------- */
  const now = new Date();
  const datePart = `${now.getDate()}-${
    now.getMonth() + 1
  }-${now.getFullYear()}`;
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
      username: user.name,
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


  const proceedToConfirm = () => {
    if (!user) {}

    if (selectedItem?.outOfStock) {
      showAlert("This product is out of stock.");
      return;
    }

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
        else if (isSelectedPayment === "coin") {
  try {
    if(parsedAmount  > balance){
      showAlert("Insufficient wallet balance");
      return
    }
    showAlert("Processing wallet payment...");
if (isDisabled) return;
setIsDisabled(true);

    let res;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
       const payload = {
      idtrx: newOrderId,
      userId,
      uid: user.uid,
      zoneId,
      product,
      productId: selectedItem.id,
      username: user.name,
      gameUsername: username,
      cost: parsedAmount,
      date: datePart,
      payment: isSelectedPayment,
      time: timePart,
      item: selectedItem.label,
      type: "game",
      api: selectedItem.api,
      stockPrice: selectedItem.price,
      ksmApi: "Lol"
    };
    if(selectedItem.api === 'smile'){
     res = await axios.post(
      `${backendUrl}/smile/create-order`,
      
        payload,
      { withCredentials: true }
    );
    } else {
          res = await axios.post(
      `${backendUrl}/gamestopup/create-order`,
      
        payload
      ,
      { withCredentials: true }
    );
    }


    setOrderDetails(res.data.orderData);
    setShowOrderModal(true);
  } catch (err) {
    showAlert(
      err.response?.data?.error || "Wallet payment failed"
    );
  }
  finally{
    setIsDisabled(false);
  }
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
        <AddPhoneNumber 
          onClose={() => setShowPhoneModal(false)}
          onSuccess={() => {
            // Phone number saved, user context will be updated automatically
            setShowPhoneModal(false);
          }}
        />
      )}

      {/* PAYMENT METHOD (DESKTOP OR MOBILE MODAL) */}
      {(!isMobile || showCheckoutModal) && (
        <div
          className={`bg-white dark:bg-zinc-800 shadow-lg p-4 mx-auto ${
            isMobile
              ? "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl  z-50 rounded-t-2xl"
              : "mb-6 "
          }`}
        >
          {isMobile && (
            <div className="flex justify-between mb-3">
              <h2 className="font-semibold text-lg dark:text-white">Choose Payment</h2>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-sm text-gray-500 dark:text-gray-400"
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
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={method === "upi" ? upi : coin} className="h-8" />
                <span className="font-semibold">
                  {method === "upi" ? "UPI / QR" : "Wallet"}
                </span>
              </div>
              ₹{parsedAmount}
            </button>
          ))}

          <button
            disabled={selectedItem?.outOfStock}
            onClick={proceedToConfirm}
            className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold ${
              selectedItem?.outOfStock ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {selectedItem?.outOfStock
              ? "Out of Stock"
              : !user
              ? "Login First"
              : `Pay ₹${parsedAmount}`}
          </button>
        </div>
      )}

      {/* BOTTOM CONFIRM BAR (MOBILE) */}
      {showBottomConfirm && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          {/* Glow layer for 3D effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-lg opacity-10 -z-10" />

          <div
            className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 
                    border-t border-purple-500/40
                    shadow-[0_-10px_30px_rgba(88,28,135,0.45)]
                    px-5 py-4 rounded-sm"
          >
            <div className="flex justify-between items-center">
              {/* LEFT: Product + Price */}
              <div className="text-white">
                <p className="text-xs uppercase tracking-wide text-purple-200">
                  Selected Product
                </p>
                <p className="text-sm font-semibold truncate max-w-[180px]">
                  {selectedItem?.label || "Selected Product"}
                </p>

                <p className="text-xl font-extrabold mt-1">₹{parsedAmount}</p>
              </div>

              {/* RIGHT: CTA */}
              <button
                disabled={selectedItem?.outOfStock}
                onClick={() => setShowCheckoutModal(true)}
                className={`relative bg-white text-purple-700 
                     px-7 py-3 rounded-xl font-bold
                     shadow-[0_8px_20px_rgba(255,255,255,0.35)]
                     active:scale-95 transition-all duration-150
                     hover:shadow-[0_12px_28px_rgba(255,255,255,0.5)] ${
                       selectedItem?.outOfStock
                         ? "opacity-50 cursor-not-allowed"
                         : ""
                     }`}
              >
                {selectedItem?.outOfStock ? "Out of Stock" : "Confirm"}
              </button>
            </div>
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

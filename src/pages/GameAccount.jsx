import React, { useState, useEffect } from "react";
import { ShoppingCart, IndianRupee, Calendar, X, Phone } from "lucide-react";
import { format } from "date-fns";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { useAlert } from "../context/AlertContext";
import { useModal } from "../context/ModalContext";
import AddPhoneNumber from "../utils/AddPhoneNumber";
import axios from "axios";
import coin from "../assets/images/topup.png";
import upi from "../assets/images/upi.png";

// Helper function to format Firebase Timestamp
const formatDate = (dateValue) => {
  if (!dateValue) return "Date not available";

  try {
    let date;
    // Check if it's a Firebase Timestamp
    if (typeof dateValue?.toDate === "function") {
      date = dateValue.toDate();
    } else if (dateValue?.seconds) {
      // Handle Timestamp object with seconds property
      date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === "string" || typeof dateValue === "number") {
      date = new Date(dateValue);
    } else {
      return "Invalid date";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    // Format the date nicely
    return format(date, "PPp"); // e.g., "Apr 29, 2021, 10:00 AM"
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date not available";
  }
};

// Buy Modal Component
const BuyModal = ({ game, onClose, onSuccess }) => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const { showAlert } = useAlert();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("coin");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const balance = user?.balance || 0;
  const parsedBalance = parseFloat(balance);
  const parsedAmount = parseFloat(game.rupees || 0);

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    if (!phone || !phone.trim()) {
      setIsPhoneValid(false);
      setPhoneError("");
      return false;
    }

    // Remove spaces, dashes, parentheses, and plus sign for validation
    const cleaned = phone.replace(/[\s\-()]/g, "");
    const digitsOnly = cleaned.replace(/^\+/, "");

    // Check if it contains only digits
    if (!/^\d+$/.test(digitsOnly)) {
      setIsPhoneValid(false);
      setPhoneError("Phone number must contain only digits");
      return false;
    }

    // Check exact length (must be exactly 10 digits)
    if (digitsOnly.length !== 10) {
      setIsPhoneValid(false);
      setPhoneError(
        digitsOnly.length < 10
          ? "Phone number must be exactly 10 digits"
          : "Phone number must be exactly 10 digits"
      );
      return false;
    }

    // Check if all digits are the same (11111111, 22222222, etc.)
    if (/^(\d)\1+$/.test(digitsOnly)) {
      setIsPhoneValid(false);
      setPhoneError("Please enter a valid phone number");
      return false;
    }

    // Check if all zeros
    if (/^0+$/.test(digitsOnly)) {
      setIsPhoneValid(false);
      setPhoneError("Please enter a valid phone number");
      return false;
    }

    // Check for sequential digits (1234567890, 9876543210, etc.)
    const isSequential = (str) => {
      let isAscending = true;
      let isDescending = true;
      for (let i = 1; i < str.length; i++) {
        if (parseInt(str[i]) !== parseInt(str[i - 1]) + 1) {
          isAscending = false;
        }
        if (parseInt(str[i]) !== parseInt(str[i - 1]) - 1) {
          isDescending = false;
        }
      }
      return isAscending || isDescending;
    };

    if (isSequential(digitsOnly) && digitsOnly.length >= 6) {
      setIsPhoneValid(false);
      setPhoneError("Please enter a valid phone number");
      return false;
    }

    // Check for repeating patterns (12121212, 123123123, etc.)
    const hasRepeatingPattern = (str) => {
      for (let len = 2; len <= Math.floor(str.length / 2); len++) {
        const pattern = str.substring(0, len);
        let matches = true;
        for (let i = len; i < str.length; i += len) {
          const segment = str.substring(i, i + len);
          if (segment !== pattern.substring(0, segment.length)) {
            matches = false;
            break;
          }
        }
        if (matches && str.length >= len * 2) {
          return true;
        }
      }
      return false;
    };

    if (hasRepeatingPattern(digitsOnly)) {
      setIsPhoneValid(false);
      setPhoneError("Please enter a valid phone number");
      return false;
    }

    // If all checks pass (exactly 10 digits and valid pattern)
    setIsPhoneValid(true);
    setPhoneError("");
    return true;
  };

  // Validate phone number on change
  useEffect(() => {
    validatePhoneNumber(phoneNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber]);

  const handlePurchase = async () => {
    if (!isPhoneValid) {
      showAlert("Please enter a valid WhatsApp phone number");
      return;
    }

    setIsProcessing(true);

    try {
      // Safety check: Ensure the game account is still available
      if (game.status !== "Available") {
        showAlert("This account is no longer available.");
        setIsProcessing(false);
        onSuccess(); // Refresh the list
        return;
      }

      const orderId = `GAMEACC-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const now = new Date();
      const datePart = `${now.getDate().toString().padStart(2, "0")}-${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${now.getFullYear()}`;
      const timePart = now.toLocaleTimeString("en-US", { hour12: true });

      const purchaseUpdate = {
        status: "pending",
        boughtBy: {
          uid: user.uid,
          username: user.name || user.username || "",
          phoneNumber: phoneNumber.trim(),
        },
        paymentMethod,
        orderId,
        rupees: parsedAmount,
        date: datePart,
        time: timePart,
        purchasedAt: serverTimestamp(),
      };

      if (paymentMethod === "coin") {
        if (parsedBalance < parsedAmount) {
          showAlert("Not enough balance.");
          setIsProcessing(false);
          return;
        }
      
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
      
        if (!userDoc.exists()) {
          showAlert("User not found.");
          setIsProcessing(false);
          return;
        }
      
        const currentBalance = parseFloat(userDoc.data().balance || 0);
        if (currentBalance < parsedAmount) {
          showAlert("Not enough balance.");
          setIsProcessing(false);
          return;
        }
      
        // Deduct balance
        await updateDoc(userRef, {
          balance: currentBalance - parsedAmount,
        });
      
        // Update game account directly
        const gameRef = doc(db, "gameAccounts", game.id);
        await updateDoc(gameRef, purchaseUpdate);
      
        showAlert("Purchase successful! Admin will process your order.");
        onSuccess();
        onClose();
      }
      else if (paymentMethod === "upi") {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
        const orderData = {
          uid: user.uid,
          id: game.id,
          cost: parsedAmount,
        };
      
        try {
          showAlert("Redirecting to payment...");
      
          const gatewayRes = await axios.post(
            `${backendUrl}/payment/start-account`,
            orderData
          );
      
          const paymentUrl =
            gatewayRes.data?.result?.result?.payment_url ||
            gatewayRes.data?.redirect_url;
      
          if (paymentUrl) {
            window.location.href = paymentUrl;
          } else {
            showAlert("Payment initialization failed.");
            setIsProcessing(false);
          }
        } catch (err) {
          console.error("Payment error:", err);
          showAlert("Failed to start payment. Try again.");
          setIsProcessing(false);
        }
      }
      
      
    } catch (error) {
      console.error("Purchase error:", error);
      showAlert("Purchase failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className={`sticky top-0 border-b p-4 flex items-center justify-between ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Purchase Game Account
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <X className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Game Info */}
          <div className={`rounded-lg p-4 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            <h3 className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>{game.label}</h3>
            <div className="flex items-center gap-1">
              <IndianRupee className={`w-4 h-4 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
              <span className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {game.rupees}
              </span>
            </div>
          </div>

          {/* WhatsApp Phone Number Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <Phone className="w-4 h-4 inline mr-1" />
              WhatsApp Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  phoneNumber && !isPhoneValid
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : phoneNumber && isPhoneValid
                    ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                    : isDark
                    ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                    : "border-gray-300 bg-white text-gray-900"
                }`}
                placeholder="Enter 10-digit phone number (e.g., 9876543210)"
              />
              {phoneNumber && isPhoneValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
            {phoneError ? (
              <p className="text-xs text-red-500 mt-1">{phoneError}</p>
            ) : phoneNumber && isPhoneValid ? (
              <p className="text-xs text-green-600 mt-1">Valid phone number</p>
            ) : (
              <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Enter exactly 10 digits (e.g., 9876543210)
              </p>
            )}
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Payment Method *
            </label>
            <div className="space-y-2">
              {["coin", "upi"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`w-full flex items-center justify-between py-3 px-4 rounded-lg transition font-medium border-2 ${
                    paymentMethod === method
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-700"
                      : isDark
                      ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                      : "bg-white border-gray-300 hover:bg-gray-50 text-gray-900"
                  }`}
                >
                  {method === "coin" && (
                    <>
                      <div className="flex items-center gap-3">
                        <img className="w-8 h-8" src={coin} alt="Coin" />
                        <div>
                          <p className="font-semibold">Balance</p>
                          <p className="text-xs">
                            <strong
                              className={
                                paymentMethod === "coin"
                                  ? "text-white"
                                  : "text-green-600"
                              }
                            >
                              {balance}
                            </strong>
                          </p>
                        </div>
                      </div>
                      <span className="font-bold">₹{parsedAmount}</span>
                    </>
                  )}

                  {method === "upi" && (
                    <>
                      <div className="flex items-center gap-3">
                        <img className="h-8" src={upi} alt="UPI" />
                        <span className="font-semibold">UPI / QR</span>
                      </div>
                      <span className="font-bold">₹{parsedAmount}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handlePurchase}
            disabled={isProcessing || !isPhoneValid}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              isProcessing || !isPhoneValid
                ? "bg-gray-400 cursor-not-allowed text-gray-300"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {isProcessing
              ? "Processing..."
              : !isPhoneValid
              ? "Enter Valid Phone Number"
              : "Confirm Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
};

const GameAccount = () => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [selectedGame, setSelectedGame] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingGame, setPendingGame] = useState(null);
  const [imageLoading, setImageLoading] = useState({});
  const [thumbnailLoading, setThumbnailLoading] = useState({});

  useEffect(() => {
    const q = query(
      collection(db, "gameAccounts"),
      where("status", "==", "Available"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const gamesList = [];
        snapshot.forEach((doc) => {
          gamesList.push({ id: doc.id, ...doc.data() });
        });
        setGames(gamesList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching game accounts:", error);
        // If orderBy fails, try without it
        const q2 = query(
          collection(db, "gameAccounts"),
          where("status", "==", "Available")
        );
        const unsubscribe2 = onSnapshot(
          q2,
          (snapshot) => {
            const gamesList = [];
            snapshot.forEach((doc) => {
              gamesList.push({ id: doc.id, ...doc.data() });
            });
            // Sort by date on client side
            gamesList.sort((a, b) => {
              const dateA = a.date?.toDate
                ? a.date.toDate().getTime()
                : new Date(a.date || 0).getTime();
              const dateB = b.date?.toDate
                ? b.date.toDate().getTime()
                : new Date(b.date || 0).getTime();
              return dateB - dateA;
            });
            setGames(gamesList);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching game accounts (fallback):", err);
            setGames([]);
            setLoading(false);
          }
        );
        return () => unsubscribe2();
      }
    );

    return () => unsubscribe();
  }, []);

  const selectImage = (gameId, index) => {
    setSelectedImageIndex({ ...selectedImageIndex, [gameId]: index });
    // Trigger loading state for the newly selected image
    setImageLoading((prev) => ({
      ...prev,
      [`${gameId}-${index}`]: true,
    }));
  };

  const handleBuyClick = (game) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    // Check if user has phone number
    if (!user.phone) {
      setPendingGame(game);
      setShowPhoneModal(true);
      return;
    }
    setSelectedGame(game);
    setShowBuyModal(true);
  };

  const handlePurchaseSuccess = () => {
    setShowBuyModal(false);
    setSelectedGame(null);
  };

  return (
    <>
      {showPhoneModal && (
        <AddPhoneNumber
          onClose={() => {
            setShowPhoneModal(false);
            setPendingGame(null);
          }}
          onSuccess={() => {
            setShowPhoneModal(false);
            // After phone is saved, open buy modal if there's a pending game
            if (pendingGame) {
              setSelectedGame(pendingGame);
              setShowBuyModal(true);
              setPendingGame(null);
            }
          }}
          message="Please add your phone number to continue with your purchase."
        />
      )}
      {showBuyModal && selectedGame && (
        <BuyModal
          game={selectedGame}
          onClose={() => {
            setShowBuyModal(false);
            setSelectedGame(null);
          }}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      <div className={`min-h-screen-dvh bg-gradient-to-br py-8 ${isDark ? "from-gray-900 to-gray-800" : "from-gray-50 to-gray-100"}`}>
        <div className="max-w-7xl px-4 md:px-6 lg:px-8 mx-auto">
          <div className="mb-8">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Game Accounts
            </h1>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Browse and purchase premium game accounts
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading game accounts...</p>
              </div>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                No available game accounts at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
              {games.map((game) => {
                const currentImageIndex = selectedImageIndex[game.id] ?? 0;
                const currentImage =
                  game.images && game.images.length > 0
                    ? game.images[currentImageIndex] || game.images[0]
                    : "https://via.placeholder.com/400x225?text=No+Image";

                return (
                  <div
                    key={game.id}
                    className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isDark ? "bg-gray-800" : "bg-white"}`}
                  >
                    {/* Main Image */}
                    <div className="relative aspect-video bg-gray-200 overflow-hidden group">
                      {/* Loading Skeleton */}
                      {imageLoading[`${game.id}-${currentImageIndex}`] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-xs text-gray-500">
                              Loading image...
                            </p>
                          </div>
                        </div>
                      )}
                      <img
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          imageLoading[`${game.id}-${currentImageIndex}`]
                            ? "opacity-0"
                            : "opacity-100"
                        }`}
                        src={currentImage}
                        alt={game.label}
                        onLoad={() => {
                          setImageLoading((prev) => ({
                            ...prev,
                            [`${game.id}-${currentImageIndex}`]: false,
                          }));
                        }}
                        onLoadStart={() => {
                          setImageLoading((prev) => ({
                            ...prev,
                            [`${game.id}-${currentImageIndex}`]: true,
                          }));
                        }}
                        onError={() => {
                          setImageLoading((prev) => ({
                            ...prev,
                            [`${game.id}-${currentImageIndex}`]: false,
                          }));
                        }}
                      />

                      {/* Image Counter Badge */}
                      {game.images && game.images.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                          {currentImageIndex + 1} / {game.images.length}
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            game.status === "Available"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {game.status}
                        </span>
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="p-5">
                      <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {game.label}
                      </h3>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <IndianRupee className={`w-5 h-5 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
                          <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            {game.rupees}
                          </span>
                        </div>
                      </div>

                      {/* Date Display */}
                      <div className={`flex items-center gap-2 mb-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          {formatDate(game.date)}
                        </span>
                      </div>

                      {/* Thumbnail Images */}
                      {game.images && game.images.length > 1 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {game.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectImage(game.id, idx)}
                              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                currentImageIndex === idx
                                  ? "border-blue-500 ring-2 ring-blue-200"
                                  : isDark
                                  ? "border-gray-600 hover:border-gray-500"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {/* Thumbnail Loading Skeleton */}
                              {thumbnailLoading[`${game.id}-thumb-${idx}`] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </div>
                              )}
                              <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className={`w-full h-full object-cover ${
                                  thumbnailLoading[`${game.id}-thumb-${idx}`]
                                    ? "opacity-0"
                                    : "opacity-100"
                                }`}
                                onLoad={() => {
                                  setThumbnailLoading((prev) => ({
                                    ...prev,
                                    [`${game.id}-thumb-${idx}`]: false,
                                  }));
                                }}
                                onLoadStart={() => {
                                  setThumbnailLoading((prev) => ({
                                    ...prev,
                                    [`${game.id}-thumb-${idx}`]: true,
                                  }));
                                }}
                                onError={() => {
                                  setThumbnailLoading((prev) => ({
                                    ...prev,
                                    [`${game.id}-thumb-${idx}`]: false,
                                  }));
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Buy Now Button */}
                      <button
                        onClick={() => handleBuyClick(game)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GameAccount;

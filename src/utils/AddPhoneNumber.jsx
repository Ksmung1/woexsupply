import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { useUser } from "../context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { FaPhone, FaTimes, FaSpinner, FaCheck } from "react-icons/fa";

/**
 * AddPhoneNumber - Reusable utility component for adding/updating phone numbers
 * Can be used anywhere in the app where phone number is required
 * 
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onSuccess - Optional callback when phone is successfully saved
 * @param {String} title - Optional custom title (default: "Add Phone Number")
 * @param {String} message - Optional custom message
 * @param {Boolean} required - Whether phone number is required (default: true)
 */
const AddPhoneNumber = ({ 
  onClose, 
  onSuccess, 
  title = "Add Phone Number",
  message = "Please add your phone number to continue with your purchase.",
  required = true 
}) => {
  const { user, setUser } = useUser();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load existing phone if available
  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  const validatePhone = (phoneNumber) => {
    const digits = phoneNumber.replace(/[^\d]/g, "");
    if (digits.length < 6) {
      return "Please enter a valid phone number (at least 6 digits).";
    }
    if (digits.length > 15) {
      return "Phone number is too long (maximum 15 digits).";
    }
    return null;
  };

  const savePhoneNumber = async () => {
    setPhoneError("");
    
    const trimmedPhone = phone.trim();
    
    if (required && !trimmedPhone) {
      setPhoneError("Phone number is required.");
      return;
    }

    if (trimmedPhone) {
      const validationError = validatePhone(trimmedPhone);
      if (validationError) {
        setPhoneError(validationError);
        return;
      }
    }

    if (!user?.uid) {
      setPhoneError("User not logged in.");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { phone: trimmedPhone });
      
      // Update user context
      if (setUser) {
        setUser((prev) => ({ ...(prev || {}), phone: trimmedPhone }));
      }

      setLoading(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(trimmedPhone);
      }
      
      // Close modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error saving phone number:", err);
      setPhoneError("Failed to save phone number. Please try again.");
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      savePhoneNumber();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !required) {
          onClose?.();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button (only if not required) */}
        {!required && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-lg" />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <FaPhone className="text-purple-600 text-2xl" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {title}
        </h2>

        {/* Message */}
        {message && (
          <p className="text-sm text-gray-600 text-center mb-6">
            {message}
          </p>
        )}

        {/* Phone Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            className={`w-full px-4 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
              phoneError
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
            }`}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneError("");
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
            autoFocus
          />
          {phoneError && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
              <FaTimes className="text-xs" />
              {phoneError}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!required && (
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            onClick={savePhoneNumber}
            disabled={loading || (required && !phone.trim())}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              loading || (required && !phone.trim())
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaCheck />
                <span>Save Phone Number</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPhoneNumber;


import React, { useState } from "react";
import { db } from "../../config/firebase";
import { useUser } from "../../context/UserContext";
import { doc, updateDoc } from "firebase/firestore";

const AddPhoneNumber = ({ onClose }) => {
  const { user } = useUser();

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  const savePhoneNumber = async () => {
    if (!phone.trim()) {
      setPhoneError("Phone number cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { phone: phone.trim() });

      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setPhoneError("Failed to save phone number. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
      <div className="p-6 rounded-lg w-[90%] max-w-sm bg-white text-black shadow-xl border border-gray-200">
        
        <h2 className="text-lg font-semibold mb-4 text-center">
          Add Phone Number
        </h2>

        <input
          type="text"
          placeholder="Enter your phone number"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-400 outline-none"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setPhoneError("");
          }}
        />

        <button
          onClick={savePhoneNumber}
          disabled={loading || !phone.trim()}
          className={`w-full px-3 py-2 rounded-lg text-white font-medium transition ${
            loading || !phone.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Saving..." : "Save Phone Number"}
        </button>

        {phoneError && (
          <p className="text-red-500 text-sm text-center mt-2">{phoneError}</p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddPhoneNumber;

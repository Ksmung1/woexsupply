import React, { createContext, useContext, useState, useEffect } from "react";

const AlertContext = createContext();
export const useAlert = () => useContext(AlertContext);  // <-- Export this!

export const AlertProvider = ({ children }) => {
  const isDarkMode = false

  const [alert, setAlert] = useState({ visible: false, message: "" });
  const [confirmData, setConfirmData] = useState({
    visible: false,
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (message) => {
    setAlert({ visible: true, message });
  };

  const showConfirm = (message, onConfirm) => {
    const wrappedOnConfirm = async () => {
      try {
        await onConfirm();
      } catch (error) {
        console.error(error);
      } finally {
        setConfirmData({ visible: false, message: "", onConfirm: () => {} });
      }
    };
    setConfirmData({
      visible: true,
      message,
      onConfirm: wrappedOnConfirm,
    });
  };

  const cancelConfirm = () => {
    setConfirmData({ visible: false, message: "", onConfirm: () => {} });
  };

  // Auto-dismiss alert after 3 seconds
  useEffect(() => {
    if (alert.visible) {
      const timer = setTimeout(() => {
        setAlert({ visible: false, message: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.visible]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* ALERT TOAST - non blocking */}
      {alert.visible && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div
            className={`w-[90%] sm:w-[400px] rounded-xl overflow-hidden shadow-2xl animate-slide-in border-2 ${
              isDarkMode
                ? "bg-gray-900 border-yellow-400/70 text-yellow-300"
                : "bg-white border-yellow-400/70 text-gray-800"
            }`}
          >
            <div
              className={`px-4 py-2 text-center font-bold text-sm tracking-wide uppercase ${
                isDarkMode
                  ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white"
                  : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
              }`}
              style={{ height: "40px", lineHeight: "28px" }}
            >
              Gamebar Official
            </div>
            <div className="px-5 py-4 text-center text-base font-medium">
              {alert.message}
            </div>
            <div className="flex justify-center p-4 pt-0">
              <button
                onClick={() => setAlert({ visible: false, message: "" })}
                className={`px-6 py-2 font-semibold rounded-md cursor-pointer transition ${
                  isDarkMode
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-indigo-500 text-white hover:bg-indigo-600"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
  {confirmData.visible && (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
    <div
      className={`p-6 rounded-xl shadow-2xl max-w-sm w-full scale-100 transition-transform duration-300
        ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}
    >
      <p className="mb-6 text-center text-lg font-medium">{confirmData.message}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={confirmData.onConfirm}
          className={`px-5 py-2 rounded-md font-semibold transition duration-200 ${
            isDarkMode
              ? "bg-green-700 hover:bg-green-800 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          Confirm
        </button>
        <button
          onClick={cancelConfirm}
          className={`px-5 py-2 rounded-md font-semibold transition duration-200 ${
            isDarkMode
              ? "bg-red-700 hover:bg-red-800 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </AlertContext.Provider>
  );
};

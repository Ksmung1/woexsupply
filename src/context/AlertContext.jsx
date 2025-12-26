import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

const AlertContext = createContext();
export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmData, setConfirmData] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirming: false,
  });

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Convenience methods
  const showAlert = useCallback((message) => {
    return showToast(message, "info");
  }, [showToast]);

  const showSuccess = useCallback((message) => {
    return showToast(message, "success");
  }, [showToast]);

  const showError = useCallback((message) => {
    return showToast(message, "error");
  }, [showToast]);

  const showWarning = useCallback((message) => {
    return showToast(message, "warning");
  }, [showToast]);

  const showConfirm = useCallback((message, onConfirm, title = "Confirm Action") => {
    const wrappedOnConfirm = async () => {
      setConfirmData((prev) => ({ ...prev, confirming: true }));
      try {
        await onConfirm();
        setConfirmData({ visible: false, title: "", message: "", onConfirm: () => {}, confirming: false });
      } catch (error) {
        console.error(error);
        setConfirmData((prev) => ({ ...prev, confirming: false }));
        showError(error?.message || "An error occurred");
      }
    };
    setConfirmData({
      visible: true,
      title,
      message,
      onConfirm: wrappedOnConfirm,
      confirming: false,
    });
  }, [showError]);

  const cancelConfirm = useCallback(() => {
    if (confirmData.confirming) return;
    setConfirmData({ visible: false, title: "", message: "", onConfirm: () => {}, confirming: false });
  }, [confirmData.confirming]);

  return (
    <AlertContext.Provider value={{ 
      showAlert, 
      showSuccess, 
      showError, 
      showWarning, 
      showConfirm,
      showToast 
    }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full md:w-auto">
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              bg: "bg-green-50 border-green-200",
              icon: FaCheckCircle,
              iconColor: "text-green-600",
              text: "text-green-800",
            },
            error: {
              bg: "bg-red-50 border-red-200",
              icon: FaTimesCircle,
              iconColor: "text-red-600",
              text: "text-red-800",
            },
            warning: {
              bg: "bg-yellow-50 border-yellow-200",
              icon: FaExclamationCircle,
              iconColor: "text-yellow-600",
              text: "text-yellow-800",
            },
            info: {
              bg: "bg-blue-50 border-blue-200",
              icon: FaInfoCircle,
              iconColor: "text-blue-600",
              text: "text-blue-800",
            },
          };

          const config = typeConfig[toast.type] || typeConfig.info;
          const Icon = config.icon;

  return (
            <div
              key={toast.id}
              className={`${config.bg} border-2 rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-slide-in-right min-w-[300px] max-w-md`}
          >
              <Icon className={`${config.iconColor} text-xl flex-shrink-0 mt-0.5`} />
              <div className={`flex-1 ${config.text} font-medium text-sm`}>
                {toast.message}
            </div>
              <button
                onClick={() => removeToast(toast.id)}
                className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
              >
                <FaTimes size={14} />
              </button>
            </div>
          );
        })}
        </div>

      {/* Confirm Modal */}
  {confirmData.visible && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={cancelConfirm}
        >
    <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">{confirmData.title}</h3>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                {confirmData.message}
              </p>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
        <button
          onClick={cancelConfirm}
                  disabled={confirmData.confirming}
                  className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
                <button
                  onClick={confirmData.onConfirm}
                  disabled={confirmData.confirming}
                  className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {confirmData.confirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
      </div>
    </div>
  </div>
)}

    </AlertContext.Provider>
  );
};

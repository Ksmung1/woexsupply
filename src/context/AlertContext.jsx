import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle, FaTimes } from "react-icons/fa";
import { useTheme } from "./ThemeContext";

const AlertContext = createContext();
export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const { isDark } = useTheme();
  const [toasts, setToasts] = useState([]);
  const [expanded, setExpanded] = useState({});
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
              bg: isDark ? "bg-green-900/30 border-green-800" : "bg-green-50 border-green-200",
              icon: FaCheckCircle,
              iconColor: isDark ? "text-green-400" : "text-green-600",
              text: isDark ? "text-green-300" : "text-green-800",
            },
            error: {
              bg: isDark ? "bg-red-900/30 border-red-800" : "bg-red-50 border-red-200",
              icon: FaTimesCircle,
              iconColor: isDark ? "text-red-400" : "text-red-600",
              text: isDark ? "text-red-300" : "text-red-800",
            },
            warning: {
              bg: isDark ? "bg-yellow-900/30 border-yellow-800" : "bg-yellow-50 border-yellow-200",
              icon: FaExclamationCircle,
              iconColor: isDark ? "text-yellow-400" : "text-yellow-600",
              text: isDark ? "text-yellow-300" : "text-yellow-800",
            },
            info: {
              bg: isDark ? "bg-blue-900/30 border-blue-800" : "bg-blue-50 border-blue-200",
              icon: FaInfoCircle,
              iconColor: isDark ? "text-blue-400" : "text-blue-600",
              text: isDark ? "text-blue-300" : "text-blue-800",
            },
          };

          const config = typeConfig[toast.type] || typeConfig.info;
          const Icon = config.icon;
          const isOpen = !!expanded[toast.id];
          const toggle = () =>
            setExpanded((prev) => ({ ...prev, [toast.id]: !prev[toast.id] }));

  return (
            <div
              key={toast.id}
              className={`${config.bg} border-2 rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-slide-in-right min-w-[300px] max-w-md`}
          >
              <Icon className={`${config.iconColor} text-xl flex-shrink-0 mt-0.5`} />
              <button
                onClick={toggle}
                className={`flex-1 text-left ${config.text} font-medium text-sm`}
                aria-expanded={isOpen}
              >
                {isOpen ? toast.message : String(toast.message).slice(0, 80)}
              </button>
              <button
                onClick={toggle}
                className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0 mr-2`}
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                {isOpen ? "−" : "+"}
              </button>
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
          className={`fixed inset-0 z-[9998] backdrop-blur-sm flex items-center justify-center p-4 ${isDark ? "bg-black/70" : "bg-black/60"}`}
          onClick={cancelConfirm}
        >
    <div
            className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">{confirmData.title}</h3>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className={`${isDark ? "text-gray-300" : "text-gray-700"} text-base leading-relaxed mb-6`}>
                {confirmData.message}
              </p>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
        <button
          onClick={cancelConfirm}
                  disabled={confirmData.confirming}
                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                      : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                  }`}
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

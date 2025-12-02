import React, { createContext, useContext, useState, useCallback } from "react";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalData, setModalData] = useState({
    isOpen: false,
    title: "",
    content: null,
    type: "close", // 'close' | 'confirm'
    onConfirm: null,
    onCancel: null,
    confirming: false,
  });

  const openModal = useCallback(
    ({ title, content, type = "close", onConfirm, onCancel }) => {
      setModalData({
        isOpen: true,
        title,
        content,
        type,
        onConfirm,
        onCancel,
        confirming: false,
      });
    },
    []
  );

  const setConfirming = useCallback((val) => {
    setModalData((prev) => ({ ...prev, confirming: val }));
  }, []);

  const closeModal = useCallback(() => {
    setModalData((prev) => ({ ...prev, isOpen: false, confirming: false }));
  }, []);

  return (
    <ModalContext.Provider value={{ modalData, openModal, closeModal, setConfirming }}>
      {children}
      {modalData.isOpen && <Modal />}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);

const Modal = () => {
  const { modalData, closeModal, setConfirming } = useModal();
  const {
    title,
    content,
    type,
    onConfirm,
    onCancel,
    confirming,
  } = modalData;

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      closeModal();
    } catch (e) {
      console.error("Confirmation failed", e);
      setConfirming(false); // Optional: retry allowed
    }
  };

  const handleCancel = () => {
    if (confirming) return;
    if (onCancel) onCancel();
    closeModal();
  };

  const isDarkMode = false
 return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[2px]  z-50">
      <div
        className={`rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 ${
          isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"
        }`}
      >
        {title && (
          <div
            className={`px-4 py-2 text-center font-bold text-sm tracking-wide uppercase rounded-t ${
              isDarkMode
                ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white"
                : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
            }`}
            style={{ height: "40px", lineHeight: "28px" }}
          >
            {title}
          </div>
        )}

        <div>{content}</div>

        <div className="flex justify-end space-x-3 mt-4">
          {type === "confirm" && (
        <>
  {/* Cancel Button */}
  <button
    onClick={handleCancel}
    disabled={confirming}
    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
      confirming
        ? "opacity-50 cursor-not-allowed"
        : isDarkMode
        ? "border border-gray-600 text-gray-300 hover:bg-gray-800"
        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
    }`}
  >
    Cancel
  </button>

  {/* Confirm Button with Spinner */}
  <button
    onClick={handleConfirm}
    disabled={confirming}
    className={`relative min-w-[120px] px-6 py-2.5 rounded-lg font-bold text-white flex items-center justify-center gap-2.5 transition-all shadow-md ${
      confirming
        ? "bg-blue-500 cursor-wait"
        : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
    }`}
  >
    {confirming ? (
      <>
        {/* Spinning Loader */}
        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </>
    ) : (
      "Confirm"
    )}
  </button>
</>
          )}

          {type === "close" && (
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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

 return (
    <div 
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
        )}

        <div className="p-6">
          <div className="text-gray-700">{content}</div>

          <div className="flex justify-end gap-3 mt-6">
          {type === "confirm" && (
        <>
  <button
    onClick={handleCancel}
    disabled={confirming}
                  className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Cancel
  </button>
  <button
    onClick={handleConfirm}
    disabled={confirming}
                  className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
  >
    {confirming ? (
      <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
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
                className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

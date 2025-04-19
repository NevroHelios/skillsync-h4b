import React from "react";

type ModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
};

const Modal = ({ children, onClose, title }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center h-screen bg-black/80 p-2 sm:p-4 backdrop-blur-md">
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/60 p-6 sm:p-8 w-full max-w-md relative flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100 tracking-tight">{title}</h2>
          <button
            className="text-gray-500 hover:text-red-400 text-3xl font-bold transition-all duration-150 px-2 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400 -mt-2 -mr-2"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
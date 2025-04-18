import React from "react";

type ModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
};

const Modal = ({ children, onClose, title }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-3 text-gray-400 hover:text-white" onClick={onClose}>
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-indigo-400">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
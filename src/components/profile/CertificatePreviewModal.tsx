import React from "react";
import { FaCertificate, FaCheckCircle, FaTimesCircle, FaUpload } from "react-icons/fa";
import { Certificate } from "./types";

type CertificatePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  cert: Certificate | null;
};

const CertificatePreviewModal = ({ open, onClose, cert }: CertificatePreviewModalProps) => {
  if (!open || !cert) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center h-screen bg-black/80 p-2 sm:p-4 backdrop-blur-md">
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/60 p-6 sm:p-8 max-w-lg w-full relative flex flex-col items-center">
        <button
          className="absolute top-3 right-4 text-gray-500 hover:text-red-400 text-3xl font-bold transition-all duration-150 px-2 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400 -mt-1 -mr-1"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="font-bold text-xl sm:text-2xl text-gray-100 mb-1 flex items-center gap-2 text-center">
            <FaCertificate className="text-indigo-400" /> {cert.title}
          </div>
          <div className="text-gray-400 text-sm mb-2">{cert.issuer} &middot; {cert.year}</div>
          <div className="mb-3">
            {cert.verified ? (
              <span className="flex items-center text-sm text-green-400 bg-green-900/50 px-3 py-1 rounded-full border border-green-700/60"><FaCheckCircle className="mr-1.5" />Verified</span>
            ) : (
              <span className="flex items-center text-sm text-yellow-400 bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-700/60"><FaTimesCircle className="mr-1.5" />Not Verified</span>
            )}
          </div>
          {cert.fileUrl && (
            <div className="w-full flex flex-col items-center gap-4 mt-2">
              <div className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg flex justify-center">
                <img
                  src={cert.fileUrl}
                  alt={`${cert.title} Certificate`}
                  className="rounded-md shadow-lg max-h-64 sm:max-h-80 object-contain"
                  style={{ maxWidth: "100%" }}
                />
              </div>
              <a
                href={cert.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.03] text-sm"
              >
                <FaUpload /> View Full Image
              </a>
            </div>
          )}
          {!cert.fileUrl && (
             <p className="text-sm text-gray-500 italic mt-4">No certificate image uploaded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificatePreviewModal;
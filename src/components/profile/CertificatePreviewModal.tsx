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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-lg w-full relative flex flex-col items-center">
        <button
          className="absolute top-3 right-4 text-gray-400 hover:text-white text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="font-bold text-2xl text-indigo-300 mb-2 flex items-center gap-2">
            <FaCertificate /> {cert.title}
          </div>
          <div className="text-gray-400 text-base mb-1">{cert.issuer} &middot; {cert.year}</div>
          <div className="mb-3">
            {cert.verified ? (
              <span className="flex items-center text-green-400"><FaCheckCircle className="mr-1" />Verified</span>
            ) : (
              <span className="flex items-center text-red-400"><FaTimesCircle className="mr-1" />Not Verified</span>
            )}
          </div>
          {cert.fileUrl && (
            <div className="w-full flex flex-col items-center">
              <img
                src={cert.fileUrl}
                alt={cert.title}
                className="rounded-lg border-2 border-indigo-700 shadow-lg max-h-72 object-contain bg-gray-800"
                style={{ maxWidth: "100%" }}
              />
              <a
                href={cert.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow transition"
              >
                <FaUpload /> View Full Image
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificatePreviewModal;
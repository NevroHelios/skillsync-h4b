import React from 'react';
import { FaCertificate, FaEye, FaSyncAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Certificate } from "@/components/profile/types";

interface CertificatesSectionProps {
  certificates: Certificate[];
  setCertPreview: (cert: Certificate | null) => void;
}

const CertificatesSection: React.FC<CertificatesSectionProps> = ({ certificates, setCertPreview }) => {
  if (!certificates || certificates.length === 0) {
    return null; // Don't render if no certificates
  }

  return (
    <div className="w-full mt-0 section-container">
      <div
        className="section-header flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4"
        style={{
          background: "linear-gradient(90deg, rgba(36,37,46,0.95) 0%, rgba(44,48,66,0.85) 100%)",
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)"
        }}
      >
        <span className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-100 tracking-tight">
          <FaCertificate size={20} className="sm:size-6 text-yellow-300" /> Certificates
        </span>
      </div>
      <div className="relative pl-5 sm:pl-7">
        <div className="absolute left-2.5 sm:left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500/40 to-yellow-700/40 rounded-full" />
        <ul className="space-y-6">
          {certificates.map((c, i) => (
            <li key={i} className="relative flex gap-5 items-start">
              <span className="absolute left-[-7px] sm:left-[-7px] top-2 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-400/80 to-yellow-700/80 border-4 border-gray-900 rounded-full shadow-lg z-10" />
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-2xl px-4 py-4 sm:px-6 sm:py-5 w-full ml-3 sm:ml-4 border border-gray-700/40 hover:border-yellow-500/60 transition-all duration-200 shadow-xl hover:shadow-2xl">
                <div className="flex-1">
                  <div className="font-semibold text-gray-100 text-base sm:text-lg">{c.title}</div>
                  <div className="text-gray-400 text-sm sm:text-base mt-1">{c.issuer} &middot; {c.year}</div>
                  {c.fileUrl && (
                    <div className="mt-3">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-900/30 text-blue-200 hover:bg-blue-800/40 hover:text-blue-100 font-medium shadow-sm border border-blue-500/20 transition-all duration-200 text-sm"
                        onClick={() => setCertPreview(c)}
                      >
                        <FaEye className="mr-1.5" /> Preview
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-shrink-0 mt-2 md:mt-0">
                  {c.status === "pending" && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-900/30 text-yellow-300 border border-yellow-500/30 font-semibold">
                      <FaSyncAlt className="animate-spin" size={11}/> Pending
                    </span>
                  )}
                  {c.status === "verified" && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-900/30 text-green-300 border border-green-500/30 font-semibold">
                      <FaCheckCircle size={13}/> Verified
                    </span>
                  )}
                  {!c.status && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-900/30 text-red-300 border border-red-500/30 font-semibold">
                      <FaTimesCircle size={13}/> Not Verified
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CertificatesSection;

import React from 'react';
import { FaTrophy } from "react-icons/fa";
import { CPProfile } from "@/components/profile/types";

interface CpProfilesSectionProps {
  cpProfiles: CPProfile[];
}

const CpProfilesSection: React.FC<CpProfilesSectionProps> = ({ cpProfiles }) => {
  if (!cpProfiles || cpProfiles.length === 0) {
    return null; // Don't render if no CP profiles
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
          <FaTrophy size={20} className="sm:size-6 text-yellow-400" /> Competitive Programming
        </span>
      </div>
      <ul className="flex flex-col gap-4">
        {cpProfiles.map((cp, i) => (
          <li
            key={i}
            className="bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-xl px-5 py-4 border border-gray-700/40 hover:border-yellow-500/60 transition-all duration-200 shadow-lg hover:shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center"
            style={{
              boxShadow: "0 4px 16px 0 rgba(0,0,0,0.14), 0 1.5px 6px 0 rgba(0,0,0,0.10)"
            }}
          >
            <div className="flex items-center gap-3">
              <a
                href={cp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-yellow-300 hover:underline font-semibold text-base sm:text-lg transition-colors duration-150"
              >
                {cp.platform}
              </a>
              <span className="text-gray-400 text-base sm:text-lg font-medium">- {cp.handle}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CpProfilesSection;

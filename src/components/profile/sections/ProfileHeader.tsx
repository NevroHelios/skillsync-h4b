import React from 'react';
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import WalletConnectButton from "@/components/WalletConnectButton";
import DomainScoresHeader from '@/components/profile/DomainScoresHeader'; // Import the new component

// Define the Domain type (can be imported from a shared types file if available)
type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud" | "DSA" | string; // Add DSA

// Define the structure of the score object stored for each domain
interface DomainScoreData {
  score: number;
  repos?: string[];
  lastUpdated?: Date | string;
}

interface ProfileHeaderProps {
  photo: string;
  name: string;
  bio: string;
  linkedin: string;
  github: string;
  leetcode: string;
  gfg: string;
  // Update scores prop type to match the structure in UserProfile
  scores?: { [key in Domain]?: DomainScoreData | number | null };
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  photo,
  name,
  bio,
  linkedin,
  github,
  leetcode,
  gfg,
  scores = {}, // Provide default empty object for scores
}) => {
  return (
    <div
      className="w-full bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-2xl p-5 sm:p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-10 border border-gray-700/40 shadow-2xl"
      style={{
        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)"
      }}
    >
      <img
        src={photo || "/default-avatar.png"}
        alt="Profile Preview"
        className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-blue-700/60 shadow-lg flex-shrink-0 bg-gray-800"
      />
      <div className="text-center md:text-left flex-grow w-full">
        <div className="font-bold text-2xl sm:text-3xl md:text-5xl text-gray-100 tracking-tight mb-2 break-words">{name || "Your Name"}</div>
        <div className="text-gray-400 text-base sm:text-lg mt-2 mb-6 max-w-2xl mx-auto md:mx-0 break-words">{bio || <span className="italic">No bio provided.</span>}</div>
        <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-3 mt-4">
          {linkedin && (
            <a
              href={`https://linkedin.com/in/${linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 text-blue-300 hover:bg-blue-800/50 hover:text-blue-200 font-medium shadow-sm border border-blue-500/20 transition-all duration-200"
              title="LinkedIn"
            >
              <FaLinkedin size={20} /> <span className="hidden sm:inline">{linkedin}</span>
            </a>
          )}
          {github && (
            <a
              href={`https://github.com/${github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/40 text-gray-200 hover:bg-gray-700/60 hover:text-white font-medium shadow-sm border border-gray-500/20 transition-all duration-200"
              title="GitHub"
            >
              <FaGithub size={20} /> <span className="hidden sm:inline">{github}</span>
            </a>
          )}
          {leetcode && (
            <a
              href={`https://leetcode.com/${leetcode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-900/30 text-orange-300 hover:bg-orange-800/50 hover:text-orange-200 font-medium shadow-sm border border-orange-500/20 transition-all duration-200"
              title="LeetCode"
            >
              <SiLeetcode size={20} /> <span className="hidden sm:inline">{leetcode}</span>
            </a>
          )}
          {gfg && (
            <a
              href={`https://auth.geeksforgeeks.org/user/${gfg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-900/30 text-green-300 hover:bg-green-800/50 hover:text-green-200 font-medium shadow-sm border border-green-500/20 transition-all duration-200"
              title="GeeksforGeeks"
            >
              <SiGeeksforgeeks size={20} /> <span className="hidden sm:inline">{gfg}</span>
            </a>
          )}
        </div>

        {/* Render DomainScoresHeader if scores are provided */}
        {/* Ensure scores object is passed correctly */}
        {scores && Object.keys(scores).length > 0 && (
          <div className="mt-6">
            <DomainScoresHeader scores={scores} />
          </div>
        )}

        <div className="mt-8 flex justify-center md:justify-start">
          <WalletConnectButton />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;

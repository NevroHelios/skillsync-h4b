import React from 'react';
import { FaLinkedin, FaGithub, FaMapMarkerAlt } from "react-icons/fa"; // Added FaMapMarkerAlt
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import WalletConnectButton from "@/components/WalletConnectButton";
import DomainScoresHeader from '@/components/profile/DomainScoresHeader';
import SkillsSection from '@/components/profile/sections/SkillsSection'; // Added SkillsSection import

// Define the Domain type (can be imported from a shared types file if available)
type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud" | "DSA" | string; // Add DSA

// Define the structure of the score object stored for each domain
interface DomainScoreData {
  score: number;
  repos?: string[];
  lastUpdated?: Date | string;
}

// Define the structure of a skill object
interface Skill {
  name: string;
  level: string; // e.g., 'Beginner', 'Intermediate', 'Advanced', 'Expert'
}

interface ProfileHeaderProps {
  photo: string;
  name: string;
  title?: string; // Added optional title/role
  location?: string; // Added optional location
  bio: string;
  linkedin: string;
  github: string;
  leetcode: string;
  gfg: string;
  // Update scores prop type to match the structure in UserProfile
  scores?: { [key in Domain]?: DomainScoreData | number | null };
  skills?: Skill[]; // Added optional skills
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  photo,
  name,
  title, // Added title
  location, // Added location
  bio,
  linkedin,
  github,
  leetcode,
  gfg,
  scores = {}, // Provide default empty object for scores
  skills = [], // Provide default empty array for skills
}) => {
  return (
    <div
      // Updated classes and style for the new UI
      className="-mt-4 w-full max-w-sm ml-0 mr-auto bg-gradient-to-br from-gray-900/70 via-gray-900/80 to-black/70 backdrop-blur-lg rounded-3xl p-1 sm:p-2 flex flex-col items-start gap-1 sm:gap-2 border border-gray-700/50 shadow-xl"
      style={{
        boxShadow: "0 10px 40px 0 rgba(0,0,0,0.2), 0 2px 8px 0 rgba(0,0,0,0.15)"
      }}
    >
      {/* Profile Picture and Basic Info */}
      <div className="flex items-start gap-4 w-full p-4"> {/* Adjusted padding and gap */}
        <img
          src={photo || "/default-avatar.png"}
          alt={`${name}'s profile picture`}
          // Updated image size and styling
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-blue-600/50 shadow-md bg-gray-800 flex-shrink-0"
        />
        <div className="flex flex-col items-start flex-grow min-w-0"> {/* Added flex-grow and min-w-0 */}
          <h1 className="font-bold text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 truncate w-full"> {/* Added truncate */}
            {name || "Your Name"}
          </h1>
          {/* Added title */}
          {title && (
            <p className="text-blue-300/80 text-sm sm:text-base font-medium leading-tight mt-0.5 truncate w-full">{title}</p>
          )}
          {/* Added location */}
          {location && (
            <div className="flex items-center gap-1 text-gray-400 text-xs sm:text-sm mt-1">
              <FaMapMarkerAlt className="text-gray-500" />
              <span>{location}</span>
            </div>
          )}
          {/* Moved Bio here */}
          <p className="text-gray-400 text-sm mt-2 leading-snug break-words">
            {bio || <span className="italic text-gray-500">No bio provided.</span>}
          </p>
        </div>
      </div>

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <div className="w-full px-4 my-3 md:my-4"> {/* Adjusted margin */}
          {/* Pass only the skill names to SkillsSection */}
          <SkillsSection skills={skills.map(skill => skill.name)} />
        </div>
      )}

      {/* Social & Coding Platform Links */}
      {/* Updated styling and structure for links */}
      <div className="flex flex-wrap justify-start items-center gap-x-3 gap-y-2 px-4 mt-2 mb-4 w-full">
        {linkedin && (
          <a
            href={`https://linkedin.com/in/${linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 hover:text-blue-200 font-medium text-xs shadow-sm border border-blue-500/30 transition-all duration-200 group"
            title="LinkedIn Profile"
          >
            <FaLinkedin size={16} className="group-hover:scale-110 transition-transform"/>
            <span className="hidden sm:inline">{linkedin}</span>
            <span className="sm:hidden">LinkedIn</span>
          </a>
        )}
        {github && (
          <a
            href={`https://github.com/${github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-700/30 text-gray-300 hover:bg-gray-600/50 hover:text-white font-medium text-xs shadow-sm border border-gray-500/30 transition-all duration-200 group"
            title="GitHub Profile"
          >
            <FaGithub size={16} className="group-hover:scale-110 transition-transform"/>
            <span className="hidden sm:inline">{github}</span>
            <span className="sm:hidden">GitHub</span>
          </a>
        )}
        {leetcode && (
          <a
            href={`https://leetcode.com/${leetcode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/20 text-orange-300 hover:bg-orange-600/40 hover:text-orange-200 font-medium text-xs shadow-sm border border-orange-500/30 transition-all duration-200 group"
            title="LeetCode Profile"
          >
            <SiLeetcode size={16} className="group-hover:scale-110 transition-transform"/>
            <span className="hidden sm:inline">{leetcode}</span>
            <span className="sm:hidden">LeetCode</span>
          </a>
        )}
        {gfg && (
          <a
            href={`https://auth.geeksforgeeks.org/user/${gfg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600/20 text-green-300 hover:bg-green-600/40 hover:text-green-200 font-medium text-xs shadow-sm border border-green-500/30 transition-all duration-200 group"
            title="GeeksforGeeks Profile"
          >
            <SiGeeksforgeeks size={16} className="group-hover:scale-110 transition-transform"/>
            <span className="hidden sm:inline">{gfg}</span>
            <span className="sm:hidden">GFG</span>
          </a>
        )}
      </div>

      {/* Domain Scores Section */}
      {scores && Object.keys(scores).length > 0 && (
        // Added border top and adjusted padding/margin
        <div className="w-full border-t border-gray-700/50 pt-4 mt-2 px-4">
          <DomainScoresHeader scores={scores} />
        </div>
      )}

      {/* Wallet Connect Button */}
      {/* Adjusted margin and centering */}
      <div className="mt-4 mb-3 w-full flex justify-center px-4">
        {/* <WalletConnectButton /> */}
      </div>
    </div>
  );
};

export default ProfileHeader;

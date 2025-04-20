"use client"; // Mark this as a Client Component

import React from 'react';
import Link from 'next/link';
import { FaLinkedin, FaGithub, FaCode } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import { ObjectId } from 'mongodb';

// Define the User interface again or import it if shared
interface User {
  _id: ObjectId | string; // Allow string if converted before passing
  name?: string;
  email: string;
  bio?: string;
  photo?: string;
  linkedin?: string;
  github?: string;
  leetcode?: string;
  gfg?: string;
}

interface UserProfileCardProps {
  user: User;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  const userIdString = typeof user._id === 'string' ? user._id : user._id.toString();

  return (
    <div key={userIdString} className="relative group flex flex-col bg-gradient-to-br from-[#23272e] via-[#161b22] to-[#23272e] border border-[#30363d] rounded-2xl shadow-xl hover:border-[#ffa28b] focus:ring-2 focus:ring-[#ffa28b] focus:ring-offset-2 transition min-h-[360px] overflow-hidden p-8 items-center text-center">
      {/* Glow effect */}
      <div className="absolute -inset-1 rounded-2xl pointer-events-none bg-gradient-to-br from-[#ffa28b33] via-transparent to-transparent blur-lg opacity-60 group-hover:opacity-90 transition z-0" />
      <div className="relative z-10 flex flex-col items-center w-full">
        {user.photo ? (
          <img
            src={user.photo}
            alt={user.name || 'User Avatar'}
            className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#ffa28b] shadow"
            onError={(e) => { (e.target as HTMLImageElement).src = '' }}
          />
        ) : (
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-[#ffa28b22] border-2 border-[#ffa28b] mb-4 shadow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ffa28b" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75V19.5z" />
            </svg>
          </div>
        )}
        <h2 className="text-2xl font-bold mb-1 text-[#ffa28b] truncate drop-shadow-lg">{user.name || 'No Name Provided'}</h2>
        <p className="text-[#ffa28b] text-sm mb-3">{user.email}</p>
        {user.bio && <p className="text-gray-400 text-xs mb-4 italic line-clamp-2 flex-grow">{user.bio}</p>}
        {/* Social Media Links */}
        <div className="flex space-x-4 mt-auto pt-4 border-t border-gray-700 w-full justify-center">
          {user.linkedin && (
            <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="text-gray-400 hover:text-[#ffa28b] transition-colors">
              <FaLinkedin size={20} />
            </a>
          )}
          {user.github && (
            <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" title="GitHub" className="text-gray-400 hover:text-[#ffa28b] transition-colors">
              <FaGithub size={20} />
            </a>
          )}
          {user.leetcode && (
            <a href={`https://leetcode.com/${user.leetcode}`} target="_blank" rel="noopener noreferrer" title="LeetCode" className="text-gray-400 hover:text-[#ffa28b] transition-colors">
              <SiLeetcode size={20} />
            </a>
          )}
          {user.gfg && (
            <a href={`https://auth.geeksforgeeks.org/user/${user.gfg}`} target="_blank" rel="noopener noreferrer" title="GeeksforGeeks" className="text-gray-400 hover:text-[#ffa28b] transition-colors">
              <FaCode size={20} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;

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
    <div key={userIdString} className="bg-gray-900 p-5 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-shadow flex flex-col items-center text-center border border-gray-700 h-full">
      <img
        src={user.photo || "/default-avatar.png"} // Use user photo or default
        alt={user.name || 'User Avatar'}
        className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-indigo-500"
        onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }} // Fallback for broken images - THIS IS ALLOWED HERE
      />
      <h2 className="text-xl font-semibold mb-1 text-indigo-300">{user.name || 'No Name Provided'}</h2>
      <p className="text-gray-400 text-sm mb-3">{user.email}</p>
      {user.bio && <p className="text-gray-500 text-xs mb-4 italic line-clamp-2 flex-grow">{user.bio}</p>}
      {/* Social Media Links */}
      <div className="flex space-x-4 mt-auto pt-4 border-t border-gray-700 w-full justify-center">
        {user.linkedin && (
          <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="text-gray-400 hover:text-indigo-400 transition-colors">
            <FaLinkedin size={20} />
          </a>
        )}
        {user.github && (
          <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" title="GitHub" className="text-gray-400 hover:text-indigo-400 transition-colors">
            <FaGithub size={20} />
          </a>
        )}
        {user.leetcode && (
          <a href={`https://leetcode.com/${user.leetcode}`} target="_blank" rel="noopener noreferrer" title="LeetCode" className="text-gray-400 hover:text-indigo-400 transition-colors">
            <SiLeetcode size={20} />
          </a>
        )}
        {user.gfg && (
          <a href={`https://auth.geeksforgeeks.org/user/${user.gfg}`} target="_blank" rel="noopener noreferrer" title="GeeksforGeeks" className="text-gray-400 hover:text-indigo-400 transition-colors">
            <FaCode size={20} /> {/* Using FaCode as a placeholder */}
          </a>
        )}
      </div>
    </div>
  );
};

export default UserProfileCard;

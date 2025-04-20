"use client";
import React, { useState } from "react";
import UserProfileCard from '@/components/UserProfileCard';
import Link from "next/link";

interface User {
  _id: string;
  name?: string;
  email: string;
  role?: string;
  bio?: string;
  photo?: string;
  linkedin?: string;
  github?: string;
  leetcode?: string;
  gfg?: string;
  gfgStats?: object;
  githubRepos?: any[];
  leetCodeStats?: object;
}

export default function DashboardClient({ users }: { users: User[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    // Assign roles based on email
    let userRole = user.role;
    if (user.email === 'admin@admin.com') userRole = 'admin';
    else if (user.email.endsWith('@hr.com')) userRole = 'hr';
    else if (user.email.endsWith('@gmail.com')) userRole = 'user';
    const matchesRole = roleFilter ? userRole === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blurred Video Background */}
      <video 
        className="absolute inset-0 w-full h-full object-cover z-0 blur-2xl" 
        autoPlay 
        loop 
        muted 
        playsInline
        preload="metadata"
        poster="https://res.cloudinary.com/dlrlet9fg/image/upload/v1742230891/video-poster.jpg"
      >
        <source 
          src="https://res.cloudinary.com/dlrlet9fg/video/upload/v1745090293/3129957-uhd_3840_2160_25fps_2_1_1_1_ohss3y.mp4" 
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
      {/* Dark Overlay */}
      <div className="absolute inset-0 w-full h-full bg-black/10 z-10"></div>
      <div className="relative z-20 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#ffa28b]">User Dashboard</h1>
        <div className="flex flex-col-reverse lg:flex-row gap-8">
          {/* Main content - User cards */}
          <div className="w-full lg:w-3/4">
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="group relative px-2">
                    {/* Glow effect */}
                    <div className="absolute -inset-1 rounded-2xl pointer-events-none bg-gradient-to-br from-[#ffa28b33] via-transparent to-transparent blur-lg opacity-60 group-hover:opacity-90 transition z-0" />
                    {/* Make the card clickable and link to /profile?email=... */}
                    <Link
                      href={`/profile?email=${encodeURIComponent(user.email)}`}
                      className="relative z-10 block focus:outline-none"
                      tabIndex={0}
                    >
                      <div className="flex flex-col bg-gradient-to-br from-[#23272e] via-[#161b22] to-[#23272e] border border-[#30363d] rounded-2xl shadow-xl hover:border-[#ffa28b] focus:ring-2 focus:ring-[#ffa28b] focus:ring-offset-2 transition min-h-[360px] overflow-hidden p-8">
                        <UserProfileCard user={{
                          ...user,
                          role: user.email === 'admin@admin.com'
                            ? 'admin'
                            : user.email.endsWith('@hr.com')
                              ? 'hr'
                              : user.email.endsWith('@gmail.com')
                                ? 'user'
                                : user.role
                        }} />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 mt-10">No user profiles found in the database.</p>
            )}
          </div>
          {/* Sidebar - Filters */}
          <div className="w-full lg:w-1/4 mb-6 lg:mb-0">
            <div className="bg-gray-800 p-5 rounded-xl mb-6 border border-gray-700 shadow-lg">
              <h3 className="text-lg font-medium text-[#ffa28b] mb-4">Search Users</h3>
              <input
                type="text"
                placeholder="Name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#ffa28b] text-white mb-4"
              />
              <h4 className="text-sm font-medium text-[#ffa28b] mb-2">Role</h4>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#ffa28b] text-white"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

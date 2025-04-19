'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// Define types locally or import if defined globally
interface UserProfile {
  _id?: string; // Changed from any to string
  name?: string;
  email: string;
  photo?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  leetcode?: string; // LeetCode username
  gfg?: string; // GeeksforGeeks username

  // LeetCode Stats
  leetcodeStats?: {
    solvedCount?: number;
    totalProblems?: number;
    acceptanceRate?: number;
    ranking?: number;
    contributionPoints?: number;
    easySolved?: number;
    totalEasy?: number;
    mediumSolved?: number;
    totalMedium?: number;
    hardSolved?: number;
    totalHard?: number;
  };

  // GeeksforGeeks Stats
  gfgStats?: {
    codingScore?: number;
    totalProblemsSolved?: number;
    monthlyCodingStreak?: number;
    overallRank?: number;
    articlesPublished?: number;
    basicSolved?: number;
    easySolved?: number;
    mediumSolved?: number;
  };
}

function ProfilePreviewSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 animate-pulse bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-md">
      <div className="w-24 h-24 rounded-full bg-gray-700 mb-2" />
      <div className="h-6 w-32 bg-gray-700 rounded mb-1" />
      <div className="h-4 w-48 bg-gray-700 rounded" />
    </div>
  );
}

async function fetchProfile(email: string): Promise<UserProfile | null> {
  if (!email) return null;
  try {
    // This function calls the /api/profile endpoint,
    // which retrieves user data from MongoDB.
    // Use relative URL for client-side fetch
    const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
        console.error(`Failed to fetch profile (${res.status}):`, await res.text());
        return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export default function ProfilePreview({ email }: { email: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
        setLoading(false);
        return;
    }
    setLoading(true);
    fetchProfile(email)
      .then(data => {
        setProfile(data);
      })
      .catch(err => {
        console.error("Profile fetch failed in component:", err);
        setProfile(null); // Ensure profile is null on error
      })
      .finally(() => {
        setLoading(false);
      });
  }, [email]);

  if (loading) {
    return <ProfilePreviewSkeleton />;
  }

  if (!profile) {
    return (
        <div className="text-center text-gray-500 bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-md">
            Could not load profile preview for {email}.
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-lg text-gray-200">
      <Image
        src={profile.photo || "/profile.png"} // Use a default avatar in /public
        alt="Profile"
        width={96}
        height={96}
        className="rounded-full object-cover border-2 border-indigo-700 shadow mb-2"
        priority // Consider removing if not LCP
      />
      <div className="font-bold text-xl text-indigo-200">{profile.name || profile.email}</div>
      {profile.bio && <div className="text-gray-400 text-base mb-1 text-center">{profile.bio}</div>}

      {/* Social Links */}
      <div className="flex gap-4 mt-2 flex-wrap justify-center border-b border-gray-700 pb-4 mb-4 w-full">
        {profile.linkedin && (
          <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">LinkedIn</a>
        )}
        {profile.github && (
          <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-100 hover:underline text-sm">GitHub</a>
        )}
        {profile.leetcode && (
          <a href={`https://leetcode.com/${profile.leetcode}`} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline text-sm">LeetCode Profile</a>
        )}
        {profile.gfg && (
          // Assuming GFG profile URL structure
          <a href={`https://auth.geeksforgeeks.org/user/${profile.gfg}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline text-sm">GFG Profile</a>
        )}
      </div>

      {/* LeetCode Stats */}
      {profile.leetcodeStats && (
        <div className="w-full border-b border-gray-700 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-orange-300 mb-2 text-center">LeetCode Stats</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-gray-400">Solved:</div> <div className="text-right">{profile.leetcodeStats.solvedCount ?? 'N/A'} / {profile.leetcodeStats.totalProblems ?? 'N/A'}</div>
            <div className="text-gray-400">Acceptance:</div> <div className="text-right">{profile.leetcodeStats.acceptanceRate ? `${profile.leetcodeStats.acceptanceRate.toFixed(1)}%` : 'N/A'}</div>
            <div className="text-gray-400">Ranking:</div> <div className="text-right">{profile.leetcodeStats.ranking?.toLocaleString() ?? 'N/A'}</div>
            <div className="text-gray-400">Contributions:</div> <div className="text-right">{profile.leetcodeStats.contributionPoints ?? 'N/A'}</div>
            <div className="text-gray-400">Easy:</div> <div className="text-right">{profile.leetcodeStats.easySolved ?? 'N/A'} / {profile.leetcodeStats.totalEasy ?? 'N/A'}</div>
            <div className="text-gray-400">Medium:</div> <div className="text-right">{profile.leetcodeStats.mediumSolved ?? 'N/A'} / {profile.leetcodeStats.totalMedium ?? 'N/A'}</div>
            <div className="text-gray-400">Hard:</div> <div className="text-right">{profile.leetcodeStats.hardSolved ?? 'N/A'} / {profile.leetcodeStats.totalHard ?? 'N/A'}</div>
          </div>
        </div>
      )}

      {/* GeeksforGeeks Stats */}
      {profile.gfgStats && (
        <div className="w-full">
          <h3 className="text-lg font-semibold text-green-300 mb-2 text-center">GeeksforGeeks Stats</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-gray-400">Coding Score:</div> <div className="text-right">{profile.gfgStats.codingScore ?? 'N/A'}</div>
            <div className="text-gray-400">Problems Solved:</div> <div className="text-right">{profile.gfgStats.totalProblemsSolved ?? 'N/A'}</div>
            <div className="text-gray-400">Monthly Streak:</div> <div className="text-right">{profile.gfgStats.monthlyCodingStreak ?? 'N/A'}</div>
            <div className="text-gray-400">Overall Rank:</div> <div className="text-right">{profile.gfgStats.overallRank?.toLocaleString() ?? 'N/A'}</div>
            <div className="text-gray-400">Articles:</div> <div className="text-right">{profile.gfgStats.articlesPublished ?? 'N/A'}</div>
            <div className="text-gray-400">Basic:</div> <div className="text-right">{profile.gfgStats.basicSolved ?? 'N/A'}</div>
            <div className="text-gray-400">Easy:</div> <div className="text-right">{profile.gfgStats.easySolved ?? 'N/A'}</div>
            <div className="text-gray-400">Medium:</div> <div className="text-right">{profile.gfgStats.mediumSolved ?? 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

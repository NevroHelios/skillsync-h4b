'use client';

import React, { useState, useEffect } from 'react';
import ProfileHeader from './profile/sections/ProfileHeader';
import SkillsSection from './profile/sections/SkillsSection';
import ExperienceSection from './profile/sections/ExperienceSection';
import StatsSection from './profile/sections/StatsSection';
import { Skill, Experience } from './profile/types';
import { LeetCodeStats, GfgStats } from './profile/sections/StatsSection';

interface UserProfile {
  _id?: string;
  name?: string;
  email: string;
  photo?: string;
  title?: string;
  location?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  leetcode?: string;
  gfg?: string;
  skills?: Skill[];
  experiences?: Experience[];
  scores?: { [key: string]: any };
  leetcodeStats?: LeetCodeStats | null;
  gfgStats?: GfgStats | null;
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

async function refreshLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
  if (!username) return null; // Added check for empty username
  console.log(`Refreshing LeetCode for ${username}...`);
  try {
    // Make the actual API call
    const res = await fetch(`/api/stats/leetcode?username=${encodeURIComponent(username)}`);
    if (!res.ok) {
      console.error(`Failed to refresh LeetCode stats (${res.status}):`, await res.text());
      return null;
    }
    const data = await res.json();
    // Assuming the API returns data in the expected format
    // Add validation if necessary
    return data.stats as LeetCodeStats;
  } catch (error) {
    console.error("Error refreshing LeetCode stats via API:", error);
    return null;
  }
}

async function refreshGfgStats(username: string): Promise<GfgStats | null> {
  if (!username) return null; // Added check for empty username
  console.log(`Refreshing GFG for ${username}...`);
  try {
    // Make the actual API call
    const res = await fetch(`/api/stats/gfg?username=${encodeURIComponent(username)}`);
    if (!res.ok) {
      console.error(`Failed to refresh GFG stats (${res.status}):`, await res.text());
      return null;
    }
    const data = await res.json();
    // Assuming the API returns data in the expected format
    // Add validation if necessary
    return data.stats as GfgStats;
  } catch (error) {
    console.error("Error refreshing GFG stats via API:", error);
    return null;
  }
}

export default function ProfilePreview({ email }: { email: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingLeetcode, setRefreshingLeetcode] = useState(false);
  const [refreshingGfg, setRefreshingGfg] = useState(false);

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
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [email]);

  const handleRefreshLeetcode = async () => {
    if (!profile?.leetcode || refreshingLeetcode) return;
    setRefreshingLeetcode(true);
    try {
      const updatedStats = await refreshLeetCodeStats(profile.leetcode);
      if (updatedStats) {
        // Update the profile state with the newly fetched stats
        setProfile(prev => prev ? { ...prev, leetcodeStats: updatedStats } : null);
      } else {
        console.warn("LeetCode refresh returned null or failed");
        // Optionally: Show a message to the user that refresh failed
      }
    } catch (error) {
      console.error("Error in handleRefreshLeetcode:", error);
    } finally {
      setRefreshingLeetcode(false);
    }
  };

  const handleRefreshGfg = async () => {
    if (!profile?.gfg || refreshingGfg) return;
    setRefreshingGfg(true);
    try {
      const updatedStats = await refreshGfgStats(profile.gfg);
      if (updatedStats) {
        // Update the profile state with the newly fetched stats
        setProfile(prev => prev ? { ...prev, gfgStats: updatedStats } : null);
      } else {
        console.warn("GFG refresh returned null or failed");
        // Optionally: Show a message to the user that refresh failed
      }
    } catch (error) {
      console.error("Error in handleRefreshGfg:", error);
    } finally {
      setRefreshingGfg(false);
    }
  };

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
    <div className="flex w-screen  flex-col items-center gap-6 sm:gap-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-10 sm:p-6 shadow-lg  text-gray-200 border border-gray-700/50">
        <div className="flex flex-row items-center gap-4 w-full">
        <div className="w-1/3 flex flex-col items-center justify-center" >
      <ProfileHeader
        photo={profile.photo || "/profile.png"}
        name={profile.name || profile.email}
        title={profile.title}
        location={profile.location}
        bio={profile.bio || ""}
        linkedin={profile.linkedin || ""}
        github={profile.github || ""}
        leetcode={profile.leetcode || ""}
        gfg={profile.gfg || ""}
        scores={profile.scores}
      />

      {profile.skills && profile.skills.length > 0 && (
        <SkillsSection skills={profile.skills} />
      )}</div>
<div className="w-2/3 flex flex-col gap-4 lg:gap-6">
      {(profile.leetcodeStats || profile.gfgStats) && (
        <StatsSection
          leetCodeStats={profile.leetcodeStats || null}
          gfgStats={profile.gfgStats || null}
          leetcode={profile.leetcode || ""}
          gfg={profile.gfg || ""}
          handleRefreshLeetcode={handleRefreshLeetcode}
          handleRefreshGfg={handleRefreshGfg}
          loading={loading} // Pass initial loading state
          refreshingLeetcode={refreshingLeetcode} // Pass specific refresh state
          refreshingGfg={refreshingGfg} // Pass specific refresh state
        />
      )}</div> </div>

      

      {profile.experiences && profile.experiences.length > 0 && (
        <ExperienceSection experiences={profile.experiences} />
      )}
    </div>
  );
}

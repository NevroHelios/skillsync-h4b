import React from "react"; // Removed unused Suspense
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Navbar from "@/components/Navbar";
import { Resend } from 'resend';
import Hero from "@/components/Hero-section/Hero";
import Security from "@/components/Security/Security";
import Collaboration from "@/components/Collaboration/Collaboration";
import Productivity from "@/components/Productivity/Productivity";
// Removed unused StickyNav and Globe imports
import Image from 'next/image'; // Import next/image

const resend = new Resend(process.env.RESEND_API_KEY);

// Extend the session type to include 'role'
type UserWithRole = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

type SessionWithRole = {
  user?: UserWithRole;
} | null;

// --- ProfilePreview component ---
async function fetchProfile(email: string) {
  if (!email) return null;
  try {
    // This function calls the /api/profile endpoint,
    // which retrieves user data from MongoDB.
    // Always use absolute URL for server-side fetch in Next.js
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const url = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    const res = await fetch(`${url}/api/profile?email=${encodeURIComponent(email)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function ProfilePreviewSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 animate-pulse">
      <div className="w-24 h-24 rounded-full bg-gray-800 mb-2" />
      <div className="h-6 w-32 bg-gray-800 rounded mb-1" />
      <div className="h-4 w-48 bg-gray-800 rounded" />
    </div>
  );
}

async function ProfilePreview({ email }: { email: string }) {
  const profile = await fetchProfile(email);
  if (!profile) return <ProfilePreviewSkeleton />;
  return (
    <div className="flex flex-col items-center gap-3 bg-gray-800 rounded-xl p-6 shadow-lg">
      {/* Use next/image Image component */}
      <Image
        src={profile.photo || "/default-avatar.png"} // Ensure default-avatar.png is in public folder
        alt="Profile"
        width={96} // Provide width (w-24 -> 96px)
        height={96} // Provide height (h-24 -> 96px)
        className="rounded-full object-cover border-2 border-indigo-700 shadow mb-2"
        priority // Add priority if it's LCP
      />
      <div className="font-bold text-xl text-indigo-200">{profile.name || profile.email}</div>
      {profile.bio && <div className="text-gray-400 text-base mb-1 text-center">{profile.bio}</div>}
      <div className="flex gap-3 mt-2">
        {profile.linkedin && (
          <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">LinkedIn</a>
        )}
        {profile.github && (
          <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-100 hover:underline">GitHub</a>
        )}
        {profile.leetcode && (
          <a href={`https://leetcode.com/${profile.leetcode}`} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">LeetCode</a>
        )}
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions) as SessionWithRole | null;

  return (
    <div className="flex flex-col min-h-screen text-gray-100">

      <div className='hero-section px-3 top-0'>
        <Hero session={session} />
      </div>
      <div id='productivity' className='home-campaign-productivity px-4 pt-8 overflow-hidden'>
        <Productivity />
      </div>
      <div id='collaboration' className='home-campaign-productivity px-4 pt-8  overflow-hidden'>
        <Collaboration />
      </div>
      {/* <div id='security' className='home-campaign-productivity px-4 pt-8 pb-16 overflow-hidden'>
        <Security />
      </div> */}

  
    </div>
  );
}
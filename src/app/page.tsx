import React, { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Navbar from "@/components/Navbar";
import { Resend } from 'resend';
import Hero from "@/components/Hero-section/Hero";
import Security from "@/components/Security/Security";
import Collaboration from "@/components/Collaboration/Collaboration";
import Productivity from "@/components/Productivity/Productivity";
import StickyNav from "@/components/Navbar/StickyNav";
import Globe from "@/components/Footer/Globe";

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
};

// Client component for the sign out button
function SignOutButton() {
  "use client";
  const { signOut } = require("next-auth/react");
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition"
    >
      Sign Out
    </button>
  );
}

// --- ProfilePreview component ---
async function fetchProfile(email: string) {
  if (!email) return null;
  try {
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

async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: 'Your App <noreply@yourdomain.com>',
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  });
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
      <img
        src={profile.photo || "/default-avatar.png"}
        alt="Profile"
        className="w-24 h-24 rounded-full object-cover border-2 border-indigo-700 shadow mb-2"
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
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
       {/* <div className='relative'>
            <img className='absolute top-0 transition ease-in duration-200 max-xl:right-[-1050px] xl:right-[-970px] -z-30 image' width='4377' src="https://github.githubassets.com/images/modules/site/home-campaign/hero-bg.webp" alt="" />
          </div> */}
          <div className='hero-section px-3 '>
            <Hero/>
          </div>
          {/* <StickyNav/> */}
          <div id='productivity' className='home-campaign-productivity px-4 pt-8 overflow-hidden'>
            <Productivity/>
          </div>
          <div id='collaboration' className='home-campaign-productivity px-4 pt-8  overflow-hidden'>
            <Collaboration/>
          </div>
          <div id='security' className='home-campaign-productivity px-4 pt-8 pb-16 overflow-hidden'>
            <Security/>
          </div>
         {/* <Globe/> */}


      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 pt-32 pb-16 bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950">
        <h1 className="text-5xl font-bold text-indigo-400 mb-4 text-center">Welcome to H4B</h1>
        <p className="text-lg text-gray-300 mb-8 text-center max-w-xl">
          The best place to manage your products and profile. Sign in to get started!
        </p>
        {!session?.user && (
          <Link
            href="/auth/signin"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded transition text-lg"
          >
            Get Started
          </Link>
        )}
        {session?.user && (
          <Link
            href="/profile"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded transition text-lg"
          >
            Go to Profile
          </Link>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="bg-gray-900 py-16 px-4 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold text-indigo-400 mb-4">About Us</h2>
          <p className="text-gray-300 text-lg">
            H4B is a modern platform for user and product management. Built with Next.js, MongoDB, and cloud image storage, it provides a seamless experience for both users and admins.
          </p>
        </div>
        {/* Profile Preview or Login Button */}
        <div className="max-w-xl mx-auto">
          {session?.user ? (
            <ProfilePreview email={session.user.email} />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="text-lg text-gray-300 mb-2">Sign up to create your profile and get started!</div>
              <Link
                href="/auth/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded transition text-lg"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Product Section */}
      <section id="products" className="bg-gray-800 py-16 px-4 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-indigo-400 mb-8 text-center">Our Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 rounded-lg shadow p-6 flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-900 rounded-full mb-4 flex items-center justify-center text-3xl">📦</div>
              <h3 className="font-bold text-lg mb-2 text-indigo-300">Product One</h3>
              <p className="text-gray-400 text-center">A great product for your needs.</p>
            </div>
            <div className="bg-gray-900 rounded-lg shadow p-6 flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-900 rounded-full mb-4 flex items-center justify-center text-3xl">🚀</div>
              <h3 className="font-bold text-lg mb-2 text-indigo-300">Product Two</h3>
              <p className="text-gray-400 text-center">Boost your workflow with this tool.</p>
            </div>
            <div className="bg-gray-900 rounded-lg shadow p-6 flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-900 rounded-full mb-4 flex items-center justify-center text-3xl">🔒</div>
              <h3 className="font-bold text-lg mb-2 text-indigo-300">Product Three</h3>
              <p className="text-gray-400 text-center">Secure and reliable for your business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-6 mt-auto text-center text-gray-400 text-sm dark:bg-gray-900">
        &copy; {new Date().getFullYear()} H4B. All rights reserved.
      </footer>
    </div>
  );
}
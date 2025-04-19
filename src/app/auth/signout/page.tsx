"use client";
import React from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function SignOut() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white/90 shadow-xl rounded-xl p-8 w-full max-w-sm flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-indigo-700 text-center">Sign Out</h2>
        <p className="mb-6 text-gray-700 text-center">Are you sure you want to sign out?</p>
        <button
          onClick={async () => {
            await signOut({ callbackUrl: "/" });
            toast.success("Signed out successfully!");
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition w-full mb-4"
        >
          Sign Out
        </button>
        <Link
          href="/"
          className="text-indigo-700 hover:underline text-sm"
        >
          Cancel
        </Link>
      </div>
    </main>
  );
}
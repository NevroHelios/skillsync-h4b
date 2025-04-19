"use client";
import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <>
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar newestOnTop closeOnClick pauseOnFocusLoss={false} theme="dark" />
      <nav className="w-full bg-gray-950/75 backdrop-blur-lg shadow border-b border-gray-700/50 flex flex-wrap items-center justify-between px-6 py-4 fixed top-0 z-10 dark:bg-gray-950/75">
        <div className="flex items-center gap-2">
          <img 
            src="https://res.cloudinary.com/dlrlet9fg/image/upload/v1745079464/Layer_1_sbyjkd.png" 
            alt="H4B Logo" 
            className="h-8 w-auto" 
          />
        </div>
        <div className="flex items-center gap-4">
          <Link href="#about" className="hover:text-indigo-400 font-medium transition">About</Link>
          <Link href="#products" className="hover:text-indigo-400 font-medium transition">Products</Link>
          <Link href="/jobs" className="hover:text-indigo-400 font-medium transition">Jobs</Link>
          {session?.user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 hover:text-indigo-400 font-medium transition">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover border border-indigo-600"
                  />
                ) : (
                    <img src="https://m.media-amazon.com/images/S/pv-target-images/3d4372d9da377f658777126d8af59b421cc4ce95ff3d7b5b162cac2371680f71._SX1080_FMjpg_.jpg" alt=""
                    className="w-6 h-6 rounded-full object-cover border border-indigo-600" />

                )}
              
              </Link>
              {(session as any).user.role === "admin" && (
                <Link href="/admin" className="hover:text-green-400 font-medium transition">Admin</Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

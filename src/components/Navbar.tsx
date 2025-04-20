"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar newestOnTop closeOnClick pauseOnFocusLoss={false} theme="dark" />
      <nav className="w-full bg-gray-950/75 backdrop-blur-lg shadow border-b border-gray-700/50 flex flex-wrap items-center justify-between px-6 py-4 fixed top-0 z-50 dark:bg-gray-950/75">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/dlrlet9fg/image/upload/v1745079464/Layer_1_sbyjkd.png"
              alt="H4B Logo"
              className="h-8 w-auto"
            />
            
          </Link>
        </div>

        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 p-2 rounded-md"
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/#about" className="text-gray-300 hover:text-indigo-400 font-medium transition">About</Link>
          <Link href="/#products" className="text-gray-300 hover:text-indigo-400 font-medium transition">Products</Link>
          <Link href="/jobs" className="text-gray-300 hover:text-indigo-400 font-medium transition">Jobs</Link>
          {session?.user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 text-gray-300 hover:text-indigo-400 font-medium transition">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-indigo-600"
                  />
                ) : (
                  <img src="https://m.media-amazon.com/images/S/pv-target-images/3d4372d9da377f658777126d8af59b421cc4ce95ff3d7b5b162cac2371680f71._SX1080_FMjpg_.jpg" alt="Default Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-indigo-600" />
                )}
                <span className="hidden lg:inline">{session.user.name || 'Profile'}</span>
              </Link>
              {(session as any).user.role === "admin" && (
                <Link href="/admin" className="text-gray-300 hover:text-green-400 font-medium transition">Admin</Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition"
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

        {isMobileMenuOpen && (
          <div className="md:hidden w-full mt-4 border-t border-gray-700/50 pt-4">
            <div className="flex flex-col items-start gap-4 px-2">
              <Link href="/#about" onClick={toggleMobileMenu} className="block w-full text-gray-300 hover:text-indigo-400 font-medium transition py-2">About</Link>
              <Link href="/#products" onClick={toggleMobileMenu} className="block w-full text-gray-300 hover:text-indigo-400 font-medium transition py-2">Products</Link>
              <Link href="/jobs" onClick={toggleMobileMenu} className="block w-full text-gray-300 hover:text-indigo-400 font-medium transition py-2">Jobs</Link>
              {session?.user ? (
                <>
                  <Link href="/profile" onClick={toggleMobileMenu} className="flex items-center gap-2 w-full text-gray-300 hover:text-indigo-400 font-medium transition py-2">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-indigo-600"
                      />
                    ) : (
                      <img src="https://m.media-amazon.com/images/S/pv-target-images/3d4372d9da377f658777126d8af59b421cc4ce95ff3d7b5b162cac2371680f71._SX1080_FMjpg_.jpg" alt="Default Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-indigo-600" />
                    )}
                    <span>{session.user.name || 'Profile'}</span>
                  </Link>
                  {(session as any).user.role === "admin" && (
                    <Link href="/admin" onClick={toggleMobileMenu} className="block w-full text-gray-300 hover:text-green-400 font-medium transition py-2">Admin</Link>
                  )}
                  <button
                    onClick={() => { signOut({ callbackUrl: "/" }); toggleMobileMenu(); }}
                    className="w-full text-left px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={toggleMobileMenu}
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
      <div className="pt-20">
        {/* Your page content goes here */}
      </div>
    </>
  );
}

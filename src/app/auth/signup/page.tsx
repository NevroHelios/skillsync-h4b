"use client";
import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react"; // Import signIn
import { toast } from "react-toastify";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Account created! Signing you in...");
      toast.success("Account created! Signing you in...");
      // Attempt to sign in immediately after successful signup
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false, // Don't redirect automatically, handle it manually
      });

      if (signInRes?.ok) {
        // Redirect to home page on successful sign-in
        window.location.href = "/";
      } else {
        // Handle sign-in error (though unlikely after successful signup)
        setError(signInRes?.error || "Sign-in failed after signup.");
        toast.error(signInRes?.error || "Sign-in failed after signup.");
        setSuccess(""); // Clear success message if sign-in fails
      }
    } else {
      setError(data.error || "Something went wrong.");
      toast.error(data.error || "Something went wrong.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950">
      <div className="bg-gray-900/90 shadow-xl rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-indigo-400 text-center">Sign Up</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {success && <div className="text-green-400 text-sm">{success}</div>}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition"
          >
            Sign Up
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-indigo-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage("If an account exists, a password reset link has been sent to your email.");
      toast.success("If an account exists, a password reset link has been sent to your email.");
      setEmail("");
    } else {
      setError(data.error || "Something went wrong.");
      toast.error(data.error || "Something went wrong.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950">
      <div className="bg-gray-900/90 shadow-xl rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-indigo-400 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {message && <div className="text-green-400 text-sm mt-4">{message}</div>}
        {error && <div className="text-red-400 text-sm mt-4">{error}</div>}
        <div className="mt-4 text-center text-sm">
          <Link href="/auth/signin" className="text-indigo-400 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}

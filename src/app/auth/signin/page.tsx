"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success("Signed in successfully!");
        router.push("/post-login-redirect");
        router.refresh();
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-indigo-950">
      <div className="bg-gray-900/90 shadow-xl rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-indigo-400 text-center">Sign In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-700 bg-gray-800 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/auth/forgot" className="text-indigo-400 hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="mt-2 text-center text-sm">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-indigo-400 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
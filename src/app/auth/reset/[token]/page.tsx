"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function ResetPassword({ params }: { params: { token: string } }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }
    const res = await fetch(`/api/auth/reset/${params.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Password reset! You can now sign in.");
      toast.success("Password reset! You can now sign in.");
      setTimeout(() => router.push("/auth/signin"), 1500);
    } else {
      setError(data.error || "Something went wrong.");
      toast.error(data.error || "Something went wrong.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white/90 shadow-xl rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-indigo-700 text-center">Reset Password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            className="border rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            className="border rounded px-3 py-2"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition"
          >
            Reset Password
          </button>
        </form>
        {message && <div className="text-green-600 text-sm mt-4">{message}</div>}
        {error && <div className="text-red-600 text-sm mt-4">{error}</div>}
      </div>
    </main>
  );
}

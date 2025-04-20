"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Import SessionUser

export default function PostLoginRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      // Still loading session data
      return;
    }

    if (status === "unauthenticated") {
      // Not logged in, redirect to signin
      router.replace("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const user = session.user as SessionUser; // Use SessionUser type
      // Redirect based on role
      switch (user.role) {
        case "admin":
          router.replace("/admin");
          break;
        case "hr":
          router.replace("/hr-profile"); // Redirect HR users to their dashboard
          break;
        case "user":
        default:
          router.replace("/profile"); // Default to developer profile
          break;
      }
    }
  }, [session, status, router]);

  // Display a loading message while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <p>Loading your dashboard...</p>
    </div>
  );
}

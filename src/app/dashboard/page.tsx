import React from 'react';
import clientPromise from "@/lib/mongodb"; // Import the MongoDB client promise
import { ObjectId } from 'mongodb'; // Import ObjectId if needed for typing
import UserProfileCard from '@/components/UserProfileCard'; // Import the new Client Component

// Define an interface for the User data structure based on your DB schema
// Keep this interface for the data fetching part
interface User {
  _id: ObjectId;
  name?: string;
  email: string;
  role?: string;
  bio?: string;
  photo?: string;
  linkedin?: string;
  github?: string;
  leetcode?: string;
  gfg?: string;
  // Add stats fields
  gfgStats?: object; // Use 'object' or a more specific type if known
  githubRepos?: any[]; // Use 'any[]' or a specific repo type
  leetCodeStats?: object; // Use 'object' or a more specific type if known
}

// Define an interface for the props passed to the Client Component (must be serializable)
interface UserSerializable {
    _id: string; // ObjectId must be converted to string
    name?: string;
    email: string;
    bio?: string;
    photo?: string;
    linkedin?: string;
    github?: string;
    leetcode?: string;
    gfg?: string;
    // Add stats fields
    gfgStats?: object;
    githubRepos?: any[];
    leetCodeStats?: object;
}


async function getUsersFromDB(): Promise<UserSerializable[]> {
  try {
    const client = await clientPromise;
    const db = client.db();
    // Fetching from 'profiles' collection which should contain the stats
    const usersCollection = db.collection<User>("profiles");
    // Ensure all fields including stats are fetched (default behavior)
    const users = await usersCollection.find({}).toArray();

    // Convert ObjectId to string for serialization
    return users.map(user => ({
        ...user, // Spread all fields including the new stats fields
        _id: user._id.toString(),
    }));
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const users = await getUsersFromDB();

  // Log the fetched user details including stats
  users.forEach(user => {
    console.log(`\nDetails of ${user.name || user.email}:`);
    console.log("  Email:", user.email);
    console.log("  GitHub Username:", user.github);
    console.log("  LeetCode Username:", user.leetcode);
    console.log("  GFG Username:", user.gfg);
    // Log stats if they exist
    if (user.githubRepos) {
        console.log("  GitHub Repos Count:", user.githubRepos.length);
        // console.log("  GitHub Repos Sample:", user.githubRepos.slice(0, 2)); // Log first 2 repos as sample
    } else {
        console.log("  GitHub Repos: Not available");
    }
    if (user.leetCodeStats) {
        console.log("  LeetCode Stats:", user.leetCodeStats);
    } else {
        console.log("  LeetCode Stats: Not available");
    }
    if (user.gfgStats) {
        console.log("  GFG Stats:", user.gfgStats);
    } else {
        console.log("  GFG Stats: Not available");
    }
  });

  return (
    <div className="container mx-auto p-4 bg-gray-950 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-indigo-400">User Dashboard</h1>
      {users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Map over users and render the UserProfileCard Client Component */}
          {users.map((user) => (
            <UserProfileCard key={user._id} user={user} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No user profiles found in the database.</p>
      )}
    </div>
  );
}

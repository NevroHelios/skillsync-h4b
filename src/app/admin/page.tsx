"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Import SessionUser

interface UserDocument {
  _id: string;
  email: string;
  role: string;
}

export default function Admin() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (user?.role === "admin") {
      setLoading(true);
      fetch("/api/admin/users")
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch users");
          return res.json();
        })
        .then(data => setUsers(data))
        .catch(err => toast.error(err.message || "Could not load users."))
        .finally(() => setLoading(false));
    }
  }, [user?.role]);

  if (!session || !user) {
    return <div className="p-4">Loading session...</div>;
  }

  if (user.role !== "admin") {
    return <div className="p-4 text-red-500">Access denied. You must be an admin.</div>;
  }

  const deleteUser = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete user");
        setUsers(users.filter((u) => u._id !== id));
        toast.success("User deleted");
      } catch (err: any) {
        toast.error(err.message || "Could not delete user.");
      }
    }
  };

  const changeUserRole = async (id: string, newRole: 'user' | 'hr' | 'admin') => {
    if (id === user?.id) {
      toast.warn("Admins cannot change their own role via this interface.");
      return;
    }
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        const res = await fetch(`/api/admin/users/${id}/role`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to change role to ${newRole}`);
        setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
        toast.success(`User role changed to ${newRole}`);
      } catch (err: any) {
        toast.error(err.message || `Could not change role to ${newRole}.`);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-indigo-400">Admin User Management</h1>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <ul className="space-y-4">
          {users.map((u) => (
            <li key={u._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-800 p-4 rounded-lg shadow">
              <div className="mb-2 sm:mb-0">
                <span className="font-semibold">{u.email}</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                  u.role === 'admin' ? 'bg-red-600 text-white' :
                  u.role === 'hr' ? 'bg-blue-600 text-white' :
                  'bg-gray-600 text-gray-200'
                }`}>
                  {u.role}
                </span>
              </div>
              <div className="flex space-x-2">
                {u.role !== 'hr' && u.email !== user?.email && (
                  <button
                    onClick={() => changeUserRole(u._id, 'hr')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition"
                  >
                    Make HR
                  </button>
                )}
                {u.role !== 'user' && u.email !== user?.email && (
                  <button
                    onClick={() => changeUserRole(u._id, 'user')}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded transition"
                  >
                    Make User
                  </button>
                )}
                {u.email !== user?.email && (
                  <button
                    onClick={() => deleteUser(u._id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
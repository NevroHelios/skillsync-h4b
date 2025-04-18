"use client";
import { useState } from 'react';

export default function HRProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  // Interface for profile data
  interface ProfileData {
    name: string;
    email: string;
    phone: string;
    address: string;
    department: string;
    joined: string;
    employeeId: string;
  }

  const [profile, setProfile] = useState<ProfileData>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Springfield, USA',
    department: 'Human Resources',
    joined: 'January 15, 2020',
    employeeId: 'HR-00123',
  });

  const [editForm, setEditForm] = useState<ProfileData>(profile);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const [showHeader, setShowHeader] = useState(true);
  
  const handleBack = () => {
    setShowHeader(false);
    setTimeout(() => {
      window.history.back();
    }, 100);
  };

  const saveProfile = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setProfile(editForm);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isEditing && (
        <header className="bg-indigo-600 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleBack}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                &larr; Back
              </button>
              <h1 className="text-3xl font-bold text-white">HR Profile</h1>
              <div className="w-12"></div> {/* Spacer for balanced layout */}
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          {!isEditing ? (
            <>
              <div className="flex items-center space-x-6 mb-6">
                <img 
                  src="/profile.png" 
                  alt="Profile Picture" 
                  className="w-24 h-24 rounded-full border-2 border-indigo-600"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-gray-600">HR Manager</p>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h3>
                  <p><strong>Phone:</strong> {profile.phone}</p>
                  <p><strong>Address:</strong> {profile.address}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Work Details</h3>
                  <p><strong>Department:</strong> {profile.department}</p>
                  <p><strong>Joined:</strong> {profile.joined}</p>
                  <p><strong>Employee ID:</strong> {profile.employeeId}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
                <form onSubmit={saveProfile} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={editForm.address}
                      onChange={handleInputChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
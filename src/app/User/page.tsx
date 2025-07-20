"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface User {
  UserID: number;
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  Passcode: string;
  UserType: string;
  CreatedAt: string;
  ProfilePhoto: string | null;
}

export default function UserProfilePage() {
  const searchParams = useSearchParams();
  const userID = searchParams.get("userID");

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userID) {
      setError("User ID is missing.");
      return;
    }

    async function fetchUser() {
      try {
        const res = await fetch(`http://localhost:3000/user?userID=${userID}`);
        const data = await res.json();

        if (data.success) {
          setUser(data.User);
        } else {
          setError(data.message || "Failed to load user.");
        }
      } catch (err) {
        setError("Error fetching user data.");
      }
    }

    fetchUser();
  }, [userID]);

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!user) {
    return <div className="p-6 text-gray-600 animate-pulse">Loading user profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-blue-700 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Community Member Profile</h1>
            <p className="text-sm text-blue-100 mt-1">Empowering safe, connected neighborhoods.</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white border-4 border-blue-300 overflow-hidden shadow-md">
            {user.ProfilePhoto ? (
              <img
                src={user.ProfilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-700 text-3xl font-bold">
                {user.FullName[0]}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 grid sm:grid-cols-2 gap-6 text-gray-800 bg-white">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="text-lg font-semibold">{user.FullName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Username</p>
            <p className="text-lg font-semibold">@{user.Username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg font-medium">{user.Email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone Number</p>
            <p className="text-lg font-medium">{user.PhoneNumber || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">User Type</p>
            <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              {user.UserType}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="text-lg">{new Date(user.CreatedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="bg-gray-100 px-6 py-4 text-right rounded-b-2xl">
          <button
            onClick={() => history.back()}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

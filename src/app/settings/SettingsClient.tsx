"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
//import bcrypt from "bcrypt";
import { useAuth } from "@/context/AuthContext";

interface User {
  UserID: number;
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  ProfilePhoto: string;
  DarkMode?: string; // "Yes" or "No"
}

export default function SettingsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { updateUser } = useAuth(); // Get update function

  // For inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  // Change Password modal
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Profile photo upload
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Controlled tab index
  const tabs = ["account", "appearance", "notifications", "language"] as const;
  type Tab = (typeof tabs)[number];
  const [activeTab, setActiveTab] = useState<Tab>("account");

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user from localStorage
        const storedUser = localStorage.getItem("admin");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(storedUser);
        setCurrentUser(user);

        // Fetch fresh data from server
        const response = await fetch(
          `https://myappapi-yo3p.onrender.com/api/user/${user.UserID}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`);
        }

        const userData = await response.json();
        setCurrentUser(userData);
        setLoading(false);
      } catch (err) {
        setError("Failed to load user data");
        console.error("Settings fetch error:", err);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handlers
  const startEdit = (field: string) => {
    setEditingField(field);
    setTempValue(String(currentUser?.[field as keyof User] || ""));
  };

  const saveField = async () => {
    if (!editingField || !currentUser) return;

    try {
      // Optimistic UI update
      const updatedUser = { ...currentUser, [editingField]: tempValue };
      setCurrentUser(updatedUser);

      // Send update to server
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/user/${currentUser.UserID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: editingField, value: tempValue }),
        }
      );

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }

      // Update localStorage
      localStorage.setItem("admin", JSON.stringify(updatedUser));
      updateUser(updatedUser);
      setEditingField(null);
    } catch (err) {
      console.error("Full error:", err);
      setError("Failed to update profile");
      setCurrentUser(currentUser);
    }
  };

  const toggleAppearance = async () => {
    if (!currentUser) return;

    const newDarkMode = currentUser.DarkMode === "Yes" ? "No" : "Yes";

    try {
      // Optimistic UI update
      setCurrentUser({ ...currentUser, DarkMode: newDarkMode });

      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/admin/${currentUser.UserID}/darkmode`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ darkMode: newDarkMode }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update dark mode: ${response.status}`);
      }

      // Update localStorage
      localStorage.setItem(
        "admin",
        JSON.stringify({
          ...currentUser,
          DarkMode: newDarkMode,
        })
      );
      updateUser({ ...currentUser, DarkMode: newDarkMode });
    } catch (err) {
      setError("Failed to update appearance settings");
      // Revert on error
      setCurrentUser(currentUser);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file
      if (!file.type.match("image.*")) {
        setPhotoError("Please select an image file");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setPhotoError("File size must be less than 2MB");
        return;
      }

      setPhotoError("");

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64 = event.target.result.toString();

          try {
            // Optimistic UI update
            setCurrentUser({ ...currentUser, ProfilePhoto: base64 });

            // Update in backend
            await fetch(
              `https://myappapi-yo3p.onrender.com/api/user/${currentUser.UserID}/photo`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profilePhoto: base64 }),
              }
            );

            // Update localStorage
            localStorage.setItem(
              "admin",
              JSON.stringify({
                ...currentUser,
                ProfilePhoto: base64,
              })
            );
            updateUser({ ...currentUser, ProfilePhoto: base64 });
          } catch (err) {
            setPhotoError("Failed to update profile photo");
            setCurrentUser(currentUser);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePassword = async () => {
    if (!currentUser) return;

    setPwdError(null);
    setPwdSuccess(false);

    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdError("All fields are required");
      return;
    }

    if (newPwd !== confirmPwd) {
      setPwdError("New passwords don't match");
      return;
    }

    if (newPwd.length < 6) {
      setPwdError("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/user/${currentUser.UserID}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password update failed");
      }

      setPwdSuccess(true);
      setTimeout(() => {
        setShowPwdModal(false);
        setOldPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setPwdSuccess(false);
      }, 1500);
   } catch (err: unknown) {
  if (err instanceof Error) {
    setPwdError(err.message || "Failed to update password");
  } else {
    setPwdError("Failed to update password");
  }
}

  };

  if (loading) {
    return (
      <div className="page-inner d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="page-inner">
        <div className="alert alert-danger">{error || "User not found"}</div>
      </div>
    );
  }

  return (
    <div className="page-inner">
      <div className="row mx-auto" style={{ maxWidth: 1600 }}>
        {/* Left nav */}
        <div className="col-md-3">
          <div className="nav flex-column nav-pills bg-white rounded p-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`nav-link mb-2${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="col-md-9">
          <div className="bg-white rounded p-4">
            {/* Account */}
            {activeTab === "account" && (
              <div>
                <h4>My Account</h4>

                {/* Profile Photo */}
                <div className="mb-4 text-center">
                  <div className="position-relative d-inline-block">
                    {currentUser.ProfilePhoto ? (
                      <img
                        src={currentUser.ProfilePhoto}
                        alt="Profile"
                        className="rounded-circle"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "120px", height: "120px" }}
                      >
                        <i className="fas fa-user fa-2x"></i>
                      </div>
                    )}
                    <button
                      className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ width: "36px", height: "36px" }}
                    >
                      <i className="fas fa-camera"></i>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="d-none"
                    />
                  </div>
                  {photoError && (
                    <div className="text-danger mt-2">{photoError}</div>
                  )}
                </div>

                {/* Editable Fields */}
                {[
                  { field: "FullName", label: "Full Name", type: "text" },
                  { field: "Email", label: "Email", type: "email" },
                  { field: "Username", label: "Username", type: "text" },
                  { field: "PhoneNumber", label: "Phone Number", type: "text" },
                ].map(({ field, label, type }) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label">{label}</label>
                    <div className="input-group">
                      <input
                        type={type}
                        className="form-control"
                        value={
                          editingField === field
                            ? tempValue
                            : String(currentUser[field as keyof User] || "")
                        }
                        readOnly={editingField !== field}
                        onChange={(e) => setTempValue(e.target.value)}
                      />
                      {editingField === field ? (
                        <button className="btn btn-success" onClick={saveField}>
                          Save
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => startEdit(field)}
                        >
                          <i className="fas fa-edit" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-danger mt-3"
                  onClick={() => setShowPwdModal(true)}
                >
                  Change Password
                </button>
              </div>
            )}

            {/* Appearance */}
            {activeTab === "appearance" && (
              <div>
                <h4>Appearance</h4>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={currentUser.DarkMode === "Yes"}
                    onChange={toggleAppearance}
                    id="darkModeSwitch"
                  />
                  <label className="form-check-label" htmlFor="darkModeSwitch">
                    Dark Mode
                  </label>
                </div>
              </div>
            )}

            {/* Other tabs remain the same */}
            {/* Notifications */}
            {activeTab === "notifications" && (
              <div>
                <h4>Notifications</h4>
                {["email", "sms", "push"].map((key) => (
                  <div className="form-check" key={key}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={key}
                    />
                    <label className="form-check-label" htmlFor={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)} Notifications
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Language */}
            {activeTab === "language" && (
              <div>
                <h4>Language</h4>
                <select className="form-select w-auto">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Chinese</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPwdModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowPwdModal(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowPwdModal(false)}
                />
              </div>
              <div className="modal-body">
                {pwdSuccess && (
                  <div className="alert alert-success">
                    Password updated successfully!
                  </div>
                )}
                {pwdError && (
                  <div className="alert alert-danger">{pwdError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label">Old Password</label>
                  <input
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    type="password"
                    className="form-control"
                    disabled={pwdSuccess}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    type="password"
                    className="form-control"
                    disabled={pwdSuccess}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    type="password"
                    className="form-control"
                    disabled={pwdSuccess}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPwdModal(false)}
                  disabled={pwdSuccess}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={updatePassword}
                  disabled={pwdSuccess}
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

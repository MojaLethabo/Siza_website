"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

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
      } catch (_err) {
        setError("Failed to load user data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

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
    } catch (_err) {
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
    } catch (_err) {
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
          } catch (_err) {
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
        setPwdError(err.message);
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
                      <Image
                        src={currentUser.ProfilePhoto}
                        alt="Profile"
                        width={120}
                        height={120}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                        unoptimized
                      />
                    ) : (
                      <div
                        className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 120, height: 120, fontSize: 40 }}
                      >
                        {currentUser.FullName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm btn-outline-primary position-absolute bottom-0 end-0"
                      aria-label="Change Profile Photo"
                      style={{ borderRadius: "50%" }}
                    >
                      ✎
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      hidden
                    />
                  </div>
                  {photoError && (
                    <div className="text-danger mt-2">{photoError}</div>
                  )}
                </div>

                {/* Editable fields */}
                {[
                  { label: "Full Name", field: "FullName" },
                  { label: "Email", field: "Email" },
                  { label: "Username", field: "Username" },
                  { label: "Phone Number", field: "PhoneNumber" },
                ].map(({ label, field }) => (
                  <div
                    className="mb-3 d-flex align-items-center justify-content-between"
                    key={field}
                  >
                    <label className="mb-0 fw-bold">{label}:</label>

                    {editingField === field ? (
                      <>
                        <input
                          type="text"
                          className="form-control me-2"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveField();
                            if (e.key === "Escape") setEditingField(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={saveField}
                          className="btn btn-primary btn-sm me-1"
                          aria-label={`Save ${label}`}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="btn btn-secondary btn-sm"
                          aria-label={`Cancel editing ${label}`}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        className="text-break flex-grow-1"
                        onClick={() => startEdit(field)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") startEdit(field);
                        }}
                        aria-label={`Edit ${label}`}
                      >
                        {currentUser[field as keyof User] || "-"}
                      </div>
                    )}
                  </div>
                ))}

                {/* Change Password */}
                <div className="mt-4">
                  <button
                    className="btn btn-warning"
                    onClick={() => setShowPwdModal(true)}
                  >
                    Change Password
                  </button>
                </div>

                {/* Password modal */}
                {showPwdModal && (
                  <div
                    className="modal d-block"
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="passwordModalTitle"
                  >
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title" id="passwordModalTitle">
                            Change Password
                          </h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowPwdModal(false)}
                            aria-label="Close"
                          ></button>
                        </div>
                        <div className="modal-body">
                          {pwdError && (
                            <div className="alert alert-danger">{pwdError}</div>
                          )}
                          {pwdSuccess && (
                            <div className="alert alert-success">
                              Password updated successfully!
                            </div>
                          )}

                          <div className="mb-3">
                            <label className="form-label">Old Password</label>
                            <input
                              type="password"
                              className="form-control"
                              value={oldPwd}
                              onChange={(e) => setOldPwd(e.target.value)}
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">New Password</label>
                            <input
                              type="password"
                              className="form-control"
                              value={newPwd}
                              onChange={(e) => setNewPwd(e.target.value)}
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              className="form-control"
                              value={confirmPwd}
                              onChange={(e) => setConfirmPwd(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowPwdModal(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={updatePassword}
                          >
                            Update Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Appearance */}
            {activeTab === "appearance" && (
              <div>
                <h4>Appearance</h4>
                <p>
                  <strong>Dark Mode:</strong>{" "}
                  {currentUser.DarkMode === "Yes" ? "Enabled" : "Disabled"}
                </p>
                <button
                  className="btn btn-outline-primary"
                  onClick={toggleAppearance}
                >
                  Toggle Dark Mode
                </button>
              </div>
            )}

            {/* Notifications (empty for now) */}
            {activeTab === "notifications" && (
              <div>
                <h4>Notifications</h4>
                <p>No notification settings yet.</p>
              </div>
            )}

            {/* Language (empty for now) */}
            {activeTab === "language" && (
              <div>
                <h4>Language</h4>
                <p>No language settings yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

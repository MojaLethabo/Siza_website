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
  const tabs = ["account"] as const;
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
    } catch (error) {
      setError("Failed to update appearance settings");
      console.error("Full error:", error);
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
          } catch (error) {
            setPhotoError("Failed to update profile photo");
            console.error("Full error:", error);
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
    } catch (error) {
      console.error("Full error:", error);
      // setPwdError(error.message || "Failed to update password");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading Settings...</p>
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="page-inner">
        <div className="alert alert-danger border-0 shadow-sm">
          {error || "User not found"}
        </div>
      </div>
    );
  }
  /*background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)", settings contaner*/
  return (
    <div className="page-inner">
      <style jsx>{`
        .settings-container {
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .settings-nav {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          padding: 1.5rem !important;
        }

        .nav-title {
          color: black;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          position: relative;
          overflow: hidden;
        }

        .nav-link::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.5s ease;
        }

        .nav-link:hover::before {
          left: 100%;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          transform: scale(1.02);
        }

        .nav-link.active::after {
          content: "";
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .nav-icon {
          font-size: 1.1rem;
          width: 20px;
          text-align: center;
        }

        .content-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .form-control {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.8);
        }

        .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          background: white;
        }

        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          color: white;
        }

        .btn-outline-gradient {
          border: 2px solid #667eea;
          color: #667eea;
          background: transparent;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-outline-gradient:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .profile-photo-container {
          position: relative;
          display: inline-block;
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        }

        .photo-upload-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px solid white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .photo-upload-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .form-switch .form-check-input {
          width: 3rem;
          height: 1.5rem;
          background-color: linear-gradient(135deg, #ff0000 0%, #764ba2 100%);
        }

        .form-switch .form-check-input:checked {
          background: linear-gradient(135deg, #ff0000 0%, #764ba2 100%);
          border-color: #667eea;
        }

        .modal-content {
          border: none;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          background: linear-gradient(135deg, #ff0000 0%, #764ba2 100%);
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .section-title {
          color: #1e293b;
          font-weight: 600;
          margin-bottom: 1.5rem;
          position: relative;
          padding-bottom: 0.5rem;
        }

        .section-title::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 50px;
          height: 3px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }
      `}</style>

      <div className="settings-container">
        <div className="row mx-auto" style={{ maxWidth: 1600 }}>
          {/* Left Navigation */}
          <div className="col-md-3 mb-4">
            <div className="settings-nav">
              <div className="nav-title">
                <i className="fas fa-cog me-2"></i>
                Settings
              </div>
              <div className="nav flex-column nav-pills">
                {tabs.map((tab) => {
                  const icons = {
                    account: "fas fa-user-circle",
                    appearance: "fas fa-paint-brush",
                    notifications: "fas fa-bell",
                    language: "fas fa-globe-americas",
                  };

                  return (
                    <button
                      key={tab}
                      className={`nav-link${
                        activeTab === tab ? " active" : ""
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      <i className={`${icons[tab]} nav-icon`}></i>
                      <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-md-9">
            <div className="content-card p-4">
              {/* Account Settings */}
              {activeTab === "account" && (
                <div>
                  <h4 className="section-title">Account Settings</h4>

                  {/* Profile Photo Section */}
                  <div className="mb-5 text-center">
                    <div className="profile-photo-container">
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
                          className="bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: "120px",
                            height: "120px",
                            background:
                              "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
                          }}
                        >
                          <i className="fas fa-user fa-2x"></i>
                        </div>
                      )}
                      <button
                        className="photo-upload-btn position-absolute bottom-0 end-0"
                        onClick={() => fileInputRef.current?.click()}
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
                      <div className="text-danger mt-2 small">{photoError}</div>
                    )}
                  </div>

                  {/* Profile Information */}
                  <div className="row">
                    {[
                      {
                        field: "FullName",
                        label: "Full Name",
                        type: "text",
                        icon: "fas fa-user",
                      },
                      {
                        field: "Email",
                        label: "Email Address",
                        type: "email",
                        icon: "fas fa-envelope",
                      },
                      {
                        field: "Username",
                        label: "Username",
                        type: "text",
                        icon: "fas fa-at",
                      },
                      {
                        field: "PhoneNumber",
                        label: "Phone Number",
                        type: "text",
                        icon: "fas fa-phone",
                      },
                    ].map(({ field, label, type, icon }) => (
                      <div className="col-md-6 mb-4" key={field}>
                        <label className="form-label fw-semibold text-dark">
                          <i className={`${icon} me-2`}></i>
                          {label}
                        </label>
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
                            <button
                              className="btn btn-gradient"
                              onClick={saveField}
                            >
                              <i className="fas fa-check me-1"></i>Save
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline-gradient"
                              onClick={() => startEdit(field)}
                            >
                              <i className="fas fa-edit" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-top">
                    <button
                      className="btn btn-gradient"
                      onClick={() => setShowPwdModal(true)}
                    >
                      <i className="fas fa-key me-2"></i>Change Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Password Change Modal */}
      {showPwdModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{
            backgroundColor:
              "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
          }}
          onClick={() => setShowPwdModal(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-semibold">
                  <i className="fas fa-key me-2"></i>Change Password
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowPwdModal(false)}
                />
              </div>
              <div className="modal-body">
                {pwdSuccess && (
                  <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success">
                    <i className="fas fa-check-circle me-2"></i>
                    Password updated successfully!
                  </div>
                )}
                {pwdError && (
                  <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {pwdError}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Current Password
                  </label>
                  <input
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    type="password"
                    className="form-control"
                    disabled={pwdSuccess}
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">New Password</label>
                  <input
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    type="password"
                    className="form-control"
                    disabled={pwdSuccess}
                    placeholder="Enter your new password"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Confirm New Password
                  </label>
                  <input
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    type="password"
                    className="form-control"
                    disabled={pwdSuccess}
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-light"
                  onClick={() => setShowPwdModal(false)}
                  disabled={pwdSuccess}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-gradient"
                  onClick={updatePassword}
                  disabled={pwdSuccess}
                >
                  <i className="fas fa-save me-2"></i>Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

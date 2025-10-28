"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface User {
  UserID: number;
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  ProfilePhoto: string;
  DarkMode?: string; // "Yes" or "No"
  Role: string; // Added Role field
}

export default function SettingsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { updateUser, logout } = useAuth();

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

  // Demote confirmation modal
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [demoteLoading, setDemoteLoading] = useState(false);
  const [demoteError, setDemoteError] = useState<string | null>(null);

  // Checkbox state for demote confirmation
  const [isDemoteConfirmed, setIsDemoteConfirmed] = useState(false);

  // Profile photo upload
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem("admin");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(storedUser);
        setCurrentUser(user);

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

  // Show success popup
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
      setSuccessMessage("");
    }, 3000); // Hide after 3 seconds
  };

  // Handlers
  const startEdit = (field: string) => {
    setEditingField(field);
    setTempValue(String(currentUser?.[field as keyof User] || ""));
  };

  const saveField = async () => {
    if (!editingField || !currentUser) return;

    try {
      const updatedUser = { ...currentUser, [editingField]: tempValue };
      setCurrentUser(updatedUser);

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

      localStorage.setItem("admin", JSON.stringify(updatedUser));
      updateUser(updatedUser);
      setEditingField(null);
      showSuccessMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Full error:", err);
      setError("Failed to update profile");
      setCurrentUser(currentUser);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.match("image.*")) {
        setPhotoError("Please select an image file");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setPhotoError("File size must be less than 2MB");
        return;
      }

      setPhotoError("");

      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64 = event.target.result.toString();

          try {
            setCurrentUser({ ...currentUser, ProfilePhoto: base64 });

            await fetch(
              `https://myappapi-yo3p.onrender.com/api/user/${currentUser.UserID}/photo`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profilePhoto: base64 }),
              }
            );

            localStorage.setItem(
              "admin",
              JSON.stringify({
                ...currentUser,
                ProfilePhoto: base64,
              })
            );
            updateUser({ ...currentUser, ProfilePhoto: base64 });
            showSuccessMessage("Profile photo updated successfully!");
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
      showSuccessMessage("Password updated successfully!");
      
      setTimeout(() => {
        setShowPwdModal(false);
        setOldPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setPwdSuccess(false);
      }, 1500);
    } catch (error) {
      console.error("Full error:", error);
    }
  };

  const handleDemoteToVolunteer = async () => {
    if (!currentUser) return;

    setDemoteLoading(true);
    setDemoteError(null);

    try {
      console.log('Attempting to demote user:', currentUser.UserID);
      
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/user/${currentUser.UserID}/set-volunteer`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log('Response status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to set role to Volunteer");
      }

      // Success - check for success flag in response
      if (data.success) {
        console.log('Success response:', data);
        
        // Show success message before logging out
        showSuccessMessage("Successfully demoted to Volunteer! Logging out...");
        
        // Wait a moment for the user to see the success message, then log out
        setTimeout(() => {
          logout();
          localStorage.removeItem("admin");
          router.push("/login");
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to set role to Volunteer");
      }
      
    }
    catch (err: unknown) {
  console.error("Demote error:", err);
  
  if (err instanceof Error) {
    setDemoteError(err.message);
  } else {
    setDemoteError("Failed to set role to Volunteer. Please try again.");
  }
} finally {
  setDemoteLoading(false);
} 
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error || "User not found"}
          <button
            className="btn btn-outline-danger btn-sm ms-3"
            onClick={() => window.location.reload()}
          >
            <i className="fas fa-sync me-1"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.5rem;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .table th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
        }
        
        .card {
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
        }

        .settings-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
        }

        .field-row {
          display: flex;
          align-items: center;
          justify-content: between;
          padding: 1rem 0;
          border-bottom: 1px solid #e9ecef;
        }

        .field-row:last-child {
          border-bottom: none;
        }

        .field-label {
          font-weight: 600;
          color: #495057;
          min-width: 150px;
        }

        .field-value {
          flex: 1;
          color: #6c757d;
        }

        .edit-btn {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .edit-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .save-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn:hover {
          background: #218838;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          margin-left: 0.5rem;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #545b62;
        }

        .input-edit {
          border: 2px solid #667eea;
          border-radius: 6px;
          padding: 0.5rem;
          width: 100%;
          font-size: 1rem;
        }

        .photo-upload-container {
          position: relative;
          display: inline-block;
        }

        .photo-upload-btn {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .photo-upload-btn:hover {
          background: #5a6fd8;
          transform: scale(1.1);
        }

        .border-left-danger {
          border-left: 4px solid #dc3545 !important;
        }

        .bg-light {
          background-color: #f8f9fa !important;
        }

        /* Success Popup Styles */
        .success-popup {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          max-width: 400px;
        }

        .success-popup.fade-out {
          animation: slideOut 0.3s ease-in;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        /* Enhanced responsive design */
        @media (max-width: 768px) {
          .settings-section {
            padding: 1.5rem;
            margin-bottom: 1rem;
          }
          
          .field-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .field-label {
            min-width: auto;
          }
        }
      `}</style>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="container-fluid py-4">
        <div className="card">
          <div className="card-header text-white py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-1">
                  <i className="fas fa-cog me-2"></i>
                  Account Settings
                </h3>
                <p className="mb-0 opacity-75">Manage your account preferences and profile</p>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                <div className="stat-badge">
                  <i className="fas fa-user me-1"></i>
                  Profile
                </div>
                <div className="stat-badge">
                  <i className="fas fa-shield-alt me-1"></i>
                  Secure
                </div>
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* Profile Photo Section */}
            <div className="settings-section">
              <h5 className="mb-4">
                <i className="fas fa-camera me-2"></i>
                Profile Photo
              </h5>
              <div className="d-flex align-items-center">
                <div className="photo-upload-container me-4">
                  {currentUser.ProfilePhoto ? (
                    <img
                      src={currentUser.ProfilePhoto}
                      alt="Profile"
                      className="rounded-circle"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div className="avatar">
                      {currentUser.FullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    className="photo-upload-btn"
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
                <div>
                  <h6 className="mb-1">Update your profile picture</h6>
                  <p className="text-muted mb-2">JPG, PNG recommended • Max 2MB</p>
                  {photoError && (
                    <div className="text-danger small">{photoError}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="settings-section">
              <h5 className="mb-4">
                <i className="fas fa-user me-2"></i>
                Profile Information
              </h5>
              
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
                <div className="field-row" key={field}>
                  <div className="field-label">
                    <i className={`${icon} me-2`}></i>
                    {label}
                  </div>
                  <div className="field-value">
                    {editingField === field ? (
                      <input
                        type={type}
                        className="input-edit"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      String(currentUser[field as keyof User] || "Not set")
                    )}
                  </div>
                  <div>
                    {editingField === field ? (
                      <div className="d-flex">
                        <button className="save-btn" onClick={saveField}>
                          <i className="fas fa-check me-1"></i>Save
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => setEditingField(null)}
                        >
                          <i className="fas fa-times me-1"></i>Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="edit-btn"
                        onClick={() => startEdit(field)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Security Section */}
            <div className="settings-section">
              <h5 className="mb-4">
                <i className="fas fa-shield-alt me-2"></i>
                Security
              </h5>
              <div className="field-row">
                <div className="field-label">
                  <i className="fas fa-key me-2"></i>
                  Password
                </div>
                <div className="field-value">
                  ••••••••
                </div>
                <div>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setShowPwdModal(true)}
                  >
                    <i className="fas fa-edit me-1"></i>Change
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Danger Zone */}
            <div className="settings-section border-left-danger">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="text-danger mb-1">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Danger Zone
                  </h5>
                  <p className="text-muted small mb-0">Irreversible account actions</p>
                </div>
              </div>
              
              <div className="border rounded p-4 bg-light">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h6 className="text-danger mb-2">Demote from Admin</h6>
                    <p className="text-muted mb-2">
                      Remove your administrative privileges and become a Volunteer.
                    </p>
                    <div className="text-danger small">
                      <i className="fas fa-exclamation-circle me-1"></i>
                      This action cannot be undone. You will lose access to all admin features.
                    </div>
                  </div>
                  
                  <div className="col-md-4 text-end">
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => setShowDemoteModal(true)}
                    >
                      <i className="fas fa-user-minus me-2"></i>
                      Demote to Volunteer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPwdModal && (
          <div
            className="modal show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowPwdModal(false)}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <h5 className="modal-title">
                    <i className="fas fa-key me-2"></i>Change Password
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowPwdModal(false)}
                  />
                </div>
                <div className="modal-body">
                  {pwdSuccess && (
                    <div className="alert alert-success border-0">
                      <i className="fas fa-check-circle me-2"></i>
                      Password updated successfully!
                    </div>
                  )}
                  {pwdError && (
                    <div className="alert alert-danger border-0">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {pwdError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Current Password</label>
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
                    <label className="form-label fw-semibold">Confirm New Password</label>
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
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={() => setShowPwdModal(false)}
                    disabled={pwdSuccess}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={updatePassword}
                    disabled={pwdSuccess}
                    style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}
                  >
                    <i className="fas fa-save me-2"></i>Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demote Confirmation Modal */}
        {showDemoteModal && (
          <div
            className="modal show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowDemoteModal(false)}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header text-white bg-danger">
                  <h5 className="modal-title">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Confirm Demotion
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowDemoteModal(false);
                      setIsDemoteConfirmed(false);
                    }}
                    disabled={demoteLoading}
                  />
                </div>
                <div className="modal-body">
                  {demoteError && (
                    <div className="alert alert-danger border-0">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {demoteError}
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <i className="fas fa-user-slash text-danger fa-3x mb-3"></i>
                    <h4 className="text-danger">Are you sure?</h4>
                  </div>

                  <div className="alert alert-warning border-0">
                    <h6 className="alert-heading">
                      <i className="fas fa-info-circle me-2"></i>
                      Important Notice
                    </h6>
                    <p className="mb-2">You are about to remove your admin privileges and become a Volunteer.</p>
                    <ul className="mb-0 ps-3">
                      <li>You will lose access to admin dashboard and features</li>
                      <li>You will no longer be able to manage users or content</li>
                      <li>This action is permanent and cannot be undone</li>
                      <li>You will be logged out immediately</li>
                    </ul>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="confirmDemote"
                      checked={isDemoteConfirmed}
                      onChange={(e) => setIsDemoteConfirmed(e.target.checked)}
                    />
                    <label className="form-check-label text-danger fw-semibold" htmlFor="confirmDemote">
                      I understand the consequences and wish to proceed
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-light"
                    onClick={() => {
                      setShowDemoteModal(false);
                      setIsDemoteConfirmed(false);
                    }}
                    disabled={demoteLoading}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDemoteToVolunteer}
                    disabled={demoteLoading || !isDemoteConfirmed}
                  >
                    {demoteLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-minus me-2"></i>
                        Yes, Demote to Volunteer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
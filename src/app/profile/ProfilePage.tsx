"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";

type User = {
  UserID: number;
  FullName: string;
  Email: string;
  Username: string;
  PhoneNumber: string;
  Passcode: string;
  UserType: string;
  CreatedAt: string;
  ProfilePhoto: string;
  DarkMode: string;
  Role?: string;
  DOB?: string;
  HomeAddress?: string;
  TrustedContacts?: string;
};

export default function AdminProfilePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<User | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse admin from localStorage", err);
      }
    }
  }, []);

  useEffect(() => {
    if (admin?.UserType === "CommunityMember") {
      setLoadingExtra(true);
      fetch(`/api/comMember?userID=${admin.UserID}`)
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then((data) => {
          setAdmin((prev) =>
            prev ? { ...prev, ...data.CommunityMember } : prev
          );
        })
        .catch((err) => console.error("Failed to load community details", err))
        .finally(() => setLoadingExtra(false));
    }
  }, [admin?.UserType, admin?.UserID]);

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "Admin":
        return "#dc3545";
      case "CommunityMember":
        return "#0d6efd";
      case "Volunteer":
        return "#198754";
      default:
        return "#6c757d";
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "Admin":
        return "fas fa-user-shield";
      case "CommunityMember":
        return "fas fa-users";
      case "Volunteer":
        return "fas fa-hands-helping";
      default:
        return "fas fa-user";
    }
  };

  if (!admin) {
    return (
      <div className="container-fluid py-5">
        <div
          className="alert border-0 text-center mx-auto"
          style={{
            maxWidth: "600px",
            background: "#fff3cd",
            color: "#856404",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <i className="fas fa-exclamation-triangle fs-4 mb-2 d-block"></i>
          <h6 className="fw-semibold mb-1">Profile Data Not Found</h6>
          <small>Admin data could not be loaded from storage.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5" style={{ background: "#f8f9fa" }}>
      <div className="row justify-content-center">
        <div className="col-xl-8 col-lg-10">
          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              background: "white",
            }}
          >
            {/* Header Section */}
            <div
              className="card-header border-0 py-4"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <div className="d-flex align-items-center">
                <i className="fas fa-user-circle fs-4 me-3"></i>
                <div>
                  <h4 className="mb-1 fw-bold">Profile Information</h4>
                  <p className="mb-0 opacity-75 small">
                    Manage your account details and preferences
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="row g-0">
                {/* Avatar Section */}
                <div className="col-lg-4">
                  <div
                    className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
                    style={{
                      background: "#f8f9fa",
                      borderRight: "1px solid #e9ecef",
                    }}
                  >
                    <div
                      className="position-relative mb-3"
                      style={{
                        width: "140px",
                        height: "140px",
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                        style={{
                          width: "100%",
                          height: "100%",
                          background: admin.ProfilePhoto
                            ? "transparent"
                            : "#e9ecef",
                          border: "4px solid white",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        }}
                      >
                        {admin.ProfilePhoto ? (
                          <img
                            src={admin.ProfilePhoto}
                            alt="Profile"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <i
                            className="fas fa-user text-muted"
                            style={{ fontSize: "3rem" }}
                          ></i>
                        )}
                      </div>
                    </div>

                    <h5 className="fw-bold mb-2 text-dark">{admin.FullName}</h5>
                    <div
                      className="badge bg-center py-2 mb-2"
                      style={{
                        background: getUserTypeColor(admin.UserType),
                        color: "white",
                        fontSize: "0.85rem",
                        borderRadius: "20px",
                      }}
                    >
                      <i
                        className={`${getUserTypeIcon(admin.UserType)} me-1`}
                      ></i>
                      {admin.UserType}
                    </div>
                    <small className="text-muted">
                      Member since {new Date(admin.CreatedAt).getFullYear()}
                    </small>
                  </div>
                </div>

                {/* Details Section */}
                <div className="col-lg-8">
                  <div className="p-4">
                    {/* Account Information */}
                    <div className="mb-4">
                      <h6
                        className="text-uppercase fw-bold mb-3 pb-2"
                        style={{
                          fontSize: "0.8rem",
                          color: "#495057",
                          borderBottom: "2px solid #e9ecef",
                          letterSpacing: "0.5px",
                        }}
                      >
                        <i className="fas fa-id-card me-2"></i>
                        Account Information
                      </h6>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "#e3f2fd",
                                color: "#1976d2",
                              }}
                            >
                              <i className="fas fa-user fs-6"></i>
                            </div>
                            <div>
                              <small className="text-muted d-block">
                                Username
                              </small>
                              <span className="fw-semibold">
                                {admin.Username}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "#f3e5f5",
                                color: "#7b1fa2",
                              }}
                            >
                              <i className="fas fa-envelope fs-6"></i>
                            </div>
                            <div className="flex-grow-1">
                              <small className="text-muted d-block">
                                Email Address
                              </small>
                              <span className="fw-semibold text-break">
                                {admin.Email}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "#e8f5e8",
                                color: "#2e7d32",
                              }}
                            >
                              <i className="fas fa-phone fs-6"></i>
                            </div>
                            <div>
                              <small className="text-muted d-block">
                                Phone Number
                              </small>
                              <span className="fw-semibold">
                                {admin.PhoneNumber || "Not provided"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="d-flex align-items-center mb-3">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: "40px",
                                height: "40px",
                                background: "#fff3e0",
                                color: "#f57c00",
                              }}
                            >
                              <i className="fas fa-calendar fs-6"></i>
                            </div>
                            <div>
                              <small className="text-muted d-block">
                                Account Created
                              </small>
                              <span className="fw-semibold">
                                {new Date(admin.CreatedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Community Member Details */}
                    {admin.UserType === "CommunityMember" && (
                      <div className="mb-4">
                        <h6
                          className="text-uppercase fw-bold mb-3 pb-2"
                          style={{
                            fontSize: "0.8rem",
                            color: "#495057",
                            borderBottom: "2px solid #e9ecef",
                            letterSpacing: "0.5px",
                          }}
                        >
                          <i className="fas fa-users me-2"></i>
                          Member Details
                        </h6>

                        {loadingExtra ? (
                          <div className="text-center py-4">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                              style={{ width: "2rem", height: "2rem" }}
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <p className="mt-2 text-muted small">
                              Loading member details...
                            </p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="d-flex align-items-center mb-3">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    background: "#fce4ec",
                                    color: "#c2185b",
                                  }}
                                >
                                  <i className="fas fa-user-tag fs-6"></i>
                                </div>
                                <div>
                                  <small className="text-muted d-block">
                                    Role
                                  </small>
                                  <span className="fw-semibold">
                                    {admin.Role || "Not specified"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-6">
                              <div className="d-flex align-items-center mb-3">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    background: "#e1f5fe",
                                    color: "#0277bd",
                                  }}
                                >
                                  <i className="fas fa-birthday-cake fs-6"></i>
                                </div>
                                <div>
                                  <small className="text-muted d-block">
                                    Date of Birth
                                  </small>
                                  <span className="fw-semibold">
                                    {admin.DOB
                                      ? new Date(admin.DOB).toLocaleDateString(
                                          "en-US",
                                          {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                          }
                                        )
                                      : "Not provided"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="col-12">
                              <div className="d-flex align-items-start mb-3">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center me-3 mt-1"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    background: "#f1f8e9",
                                    color: "#558b2f",
                                  }}
                                >
                                  <i className="fas fa-home fs-6"></i>
                                </div>
                                <div className="flex-grow-1">
                                  <small className="text-muted d-block">
                                    Home Address
                                  </small>
                                  <span className="fw-semibold">
                                    {admin.HomeAddress || "Not provided"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="col-12">
                              <div className="d-flex align-items-start mb-3">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center me-3 mt-1"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    background: "#fff8e1",
                                    color: "#ff8f00",
                                  }}
                                >
                                  <i className="fas fa-shield-alt fs-6"></i>
                                </div>
                                <div className="flex-grow-1">
                                  <small className="text-muted d-block">
                                    Trusted Contacts
                                  </small>
                                  <span className="fw-semibold">
                                    {admin.TrustedContacts || "None specified"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Edit Button */}
            <div
              className="card-footer border-0 py-3"
              style={{ background: "#f8f9fa" }}
            >
              <div className="d-flex justify-content-end">
                <button
                  className="btn btn-outline-dark px-4 py-2 fw-semibold"
                  onClick={() => router.push("/settings")}
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #764ba2",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(73, 80, 87, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#495057";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <i className="fas fa-edit me-2"></i>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

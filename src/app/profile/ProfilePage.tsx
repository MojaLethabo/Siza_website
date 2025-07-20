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
  Role?: string; // now optional
  DOB?: string;
  HomeAddress?: string;
  TrustedContacts?: string;
};

export default function AdminProfilePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<User | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // 1) Load basic user
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

  // 2) If community member, fetch extra fields
  useEffect(() => {
    if (admin?.UserType === "CommunityMember") {
      setLoadingExtra(true);
      fetch(`/api/comMember?userID=${admin.UserID}`)
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then((data) => {
          // data.CommunityMember has Role, DOB, HomeAddress, TrustedContacts
          setAdmin((prev) =>
            prev ? { ...prev, ...data.CommunityMember } : prev
          );
        })
        .catch((err) => console.error("Failed to load community details", err))
        .finally(() => setLoadingExtra(false));
    }
  }, [admin?.UserType, admin?.UserID]);

  if (!admin) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-warning text-center">
          Admin data not found in localStorage.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5">
      <div className={`card mx-auto ${styles.prof}`}>
        <div className="row g-0 p-4 align-items-center">
          {/* Avatar */}
          <div className="col-md-4 text-center border-end">
            <div
              className={`rounded-circle mb-2 mx-auto d-flex align-items-center justify-content-center bg-secondary text-white ${styles.avatarPlaceholder}`}
              style={{ width: 120, height: 120 }}
            >
              {admin.ProfilePhoto ? (
                <img
                  src={admin.ProfilePhoto}
                  alt="Admin Profile"
                  className="rounded-circle"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <i className="fas fa-user fa-2x"></i>
              )}
            </div>
          </div>

          {/* Admin details */}
          <div className="col-md-8">
            <h5 className="mb-4">Profile Details</h5>
            <dl className="row">
              <dt className="col-sm-4">Full Name</dt>
              <dd className="col-sm-8">{admin.FullName}</dd>

              <dt className="col-sm-4">Username</dt>
              <dd className="col-sm-8">{admin.Username}</dd>

              <dt className="col-sm-4">Email</dt>
              <dd className="col-sm-8">{admin.Email}</dd>

              <dt className="col-sm-4">Phone Number</dt>
              <dd className="col-sm-8">{admin.PhoneNumber}</dd>

              <dt className="col-sm-4">User Type</dt>
              <dd className="col-sm-8">{admin.UserType}</dd>

              <dt className="col-sm-4">Account Created</dt>
              <dd className="col-sm-8">
                {new Date(admin.CreatedAt).toLocaleString()}
              </dd>

              <dt className="col-sm-4">Dark Mode</dt>
              <dd className="col-sm-8">No</dd>
              {/* {admin.DarkMode}*/}

              {/* only for CommunityMember */}
              {admin.UserType === "CommunityMember" && (
                <>
                  {loadingExtra ? (
                    <dd className="col-sm-8 text-muted">Loading...</dd>
                  ) : (
                    <>
                      <dt className="col-sm-4">Role</dt>
                      <dd className="col-sm-8">{admin.Role}</dd>

                      <dt className="col-sm-4">Date of Birth</dt>
                      <dd className="col-sm-8">
                        {admin.DOB
                          ? new Date(admin.DOB).toLocaleDateString()
                          : ""}
                      </dd>

                      <dt className="col-sm-4">Home Address</dt>
                      <dd className="col-sm-8">{admin.HomeAddress}</dd>

                      <dt className="col-sm-4">Trusted Contacts</dt>
                      <dd className="col-sm-8">{admin.TrustedContacts}</dd>
                    </>
                  )}
                </>
              )}
            </dl>

            <div className="text-end mt-4">
              <button
                className="btn btn-danger"
                onClick={() => router.push("/settings")}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

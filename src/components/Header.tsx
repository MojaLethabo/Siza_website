"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
//import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLLIElement>(null);
  const userRef = useRef<HTMLLIElement>(null);
 // const { user, logout } = useAuth();
  const router = useRouter();
  const [adminName, setAdminName] = useState("Guest");
  const [adminEmail, setAdminEmail] = useState("");

  const pathname = usePathname();

  const handleLogout = () => {
  //  logout();
    router.push("/login");
    setUserOpen(false);
  };

  // ✅ Get admin name from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.Username) {
          setAdminName(parsed.Username);
        }
        if (parsed && parsed.Email) {
          setAdminEmail(parsed.Email);
        }
      } catch (e) {
        console.error("Invalid admin data in localStorage", e);
      }
    }
  }, []);

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Close dropdowns on route change
  useEffect(() => {
    setNotifOpen(false);
    setUserOpen(false);
  }, [pathname]);

  return (
    <div className="main-header">
      {/* Logo Header */}
      <div className="main-header-logo">
        <div className="logo-header" data-background-color="dark">
          <Link href="/home" className="logo">
            <img
              src="/img/siza.png"
              alt="navbar brand"
              className="navbar-brand"
              height={20}
              width={150}
            />
          </Link>

          <div className="nav-toggle">
            <button className="btn btn-toggle toggle-sidebar">
              <i className="gg-menu-right" />
            </button>
            <button className="btn btn-toggle sidenav-toggler">
              <i className="gg-menu-left" />
            </button>
          </div>

          <button className="topbar-toggler more">
            <i className="gg-more-vertical-alt" />
          </button>
        </div>
      </div>

      <nav className="navbar navbar-header navbar-header-transparent navbar-expand-lg border-bottom">
        <div className="container-fluid">
          <ul className="navbar-nav topbar-nav ms-md-auto align-items-center">
            {/* Notification Bell */}
            <li
              className="nav-item topbar-icon dropdown hidden-caret"
              ref={notifRef}
              style={{ position: "relative" }}
            >
              <button
                className="nav-link btn btn-link"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setUserOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={notifOpen}
              >
                <i className="fas fa-bell"></i>
                <span className="notification">4</span>
              </button>

              <ul
                className={`dropdown-menu notif-box animated fadeIn${
                  notifOpen ? " show" : ""
                }`}
                style={{ minWidth: 300 }}
              >
                <li>
                  <div className="dropdown-title">
                    You have 4 new notifications
                  </div>
                </li>
                <li>
                  <div className="notif-scroll scrollbar-outer">
                    <div className="notif-center">
                      <Link href="/notifications" className="notif-item">
                        <div className="notif-icon notif-primary">
                          <i className="fas fa-user-plus"></i>
                        </div>
                        <div className="notif-content">
                          <span className="block">New user registered</span>
                          <span className="time">5 minutes ago</span>
                        </div>
                      </Link>
                      <Link href="/notifications" className="notif-item">
                        <div className="notif-icon notif-success">
                          <i className="fas fa-comment"></i>
                        </div>
                        <div className="notif-content">
                          <span className="block">
                            Rahmad commented on Admin
                          </span>
                          <span className="time">12 minutes ago</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </li>
                <li>
                  <Link href="/notifications" className="see-all">
                    See all notifications <i className="fa fa-angle-right"></i>
                  </Link>
                </li>
              </ul>
            </li>

            {/* User Icon Dropdown */}
            <li
              className="nav-item topbar-user dropdown hidden-caret"
              ref={userRef}
              style={{ position: "relative" }}
            >
              <button
                className="dropdown-toggle profile-pic btn btn-link"
                onClick={() => {
                  setUserOpen((o) => !o);
                  setNotifOpen(false);
                }}
                aria-expanded={userOpen}
              >
                <div
                  className="avatar-lg d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle mx-auto mb-2"
                  style={{ width: "50px", height: "50px" }}
                >
                  {adminEmail ? (
                    <img
                      src={
                        JSON.parse(localStorage.getItem("admin") || "{}")
                          ?.ProfilePhoto || ""
                      }
                      alt="Admin Profile"
                      className="rounded-circle"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <i className="fas fa-user fa-2x"></i>
                  )}
                </div>
                <span className="profile-username ms-2">
                  <span className="op-7">Hi,</span>{" "}
                 {/*} <span className="fw-bold">{user?.Username || adminName}</span>*/}
                </span>
              </button>

              <ul
                className={`dropdown-menu dropdown-user animated fadeIn${
                  userOpen ? " show" : ""
                }`}
                style={{ minWidth: 200 }}
              >
                <div className="dropdown-user-scroll scrollbar-outer">
                  <li>
                    <div className="user-box text-center p-3">
                      <div
                        className="avatar-lg d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle mx-auto mb-2"
                        style={{ width: "50px", height: "50px" }}
                      >
                        {adminEmail ? (
                          <img
                            src={
                              JSON.parse(localStorage.getItem("admin") || "{}")
                                ?.ProfilePhoto || ""
                            }
                            alt="Admin Profile"
                            className="rounded-circle"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        ) : (
                          <i className="fas fa-user fa-2x"></i>
                        )}
                      </div>
                      <div className="u-text">
                       {/*} <h4>{user?.Username || adminName}</h4>*/}
                        <p className="text-muted">
                         {/* {user?.Email || adminEmail}*/}
                        </p>
                        <Link
                          href="/profile"
                          className="btn btn-xs btn-secondary btn-sm"
                          onClick={() => setUserOpen(false)}
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="dropdown-divider"></div>
                    <Link
                      href="/settings"
                      className="dropdown-item"
                      onClick={() => setUserOpen(false)}
                    >
                      Account Setting
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </div>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}

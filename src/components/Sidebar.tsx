"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const toggleSidebar = () => {
    document.body.classList.toggle("sidebar_minimize");
    setSidebarMinimized(!sidebarMinimized);
  };

  const toggleAnalytics = () => {
    if (!sidebarMinimized) setAnalyticsOpen(!analyticsOpen);
  };

  // Close dropdown when sidebar is minimized
  useEffect(() => {
    if (sidebarMinimized) setAnalyticsOpen(false);
  }, [sidebarMinimized]);

  const sidebarStyles = {
    backgroundColor: "#ffffff",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
    borderRight: "1px solid #e0e0e0",
  };

  const logoHeaderStyles = {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e0e0e0",
  };

  const iconStyles = {
    color: "#dc3545", // Bootstrap red color
  };

  const activeItemStyles = {
    backgroundColor: "#f8f9fa",
    borderLeft: "3px solid #dc3545",
  };

  const linkStyles = {
    color: "#333333",
    textDecoration: "none",
  };

  const activeLinkStyles = {
    color: "#dc3545",
    fontWeight: "500",
  };

  // Check if any analytics child is active
  const isAnalyticsActive =
    pathname === "/Analytics" || pathname === "/MapReview";

  return (
    <div className="sidebar" style={sidebarStyles}>
      <div className="sidebar-logo">
        <div className="logo-header" style={logoHeaderStyles}>
          <Link
            href="/Home"
            className="logo"
            style={{ width: "150px", height: "50px" }}
          >
            <Image
              src="/img/SIZA_Logo.png"
              alt="navbar brand"
              className="navbar-brand"
              width={150}
              height={50}
            />
          </Link>

          <div className="nav-toggle">
            <button
              className="btn btn-toggle toggle-sidebar"
              onClick={toggleSidebar}
              style={{
                width: "44px",
                height: "44px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                border: "none",
              }}
            >
              <i className="gg-menu-right" style={iconStyles}></i>
            </button>
          </div>

          <button
            className="topbar-toggler more"
            style={{ backgroundColor: "transparent", border: "none" }}
          >
            <i className="gg-more-vertical-alt" style={iconStyles}></i>
          </button>
        </div>
      </div>

      <div className="sidebar-wrapper scrollbar scrollbar-inner">
        <div
          className="sidebar-content"
          style={{
            paddingRight: sidebarMinimized ? "10px" : "20px",
            transition: "padding 0.3s ease",
          }}
        >
          <ul className="nav nav-secondary">
            <li
              className={`nav-item ${pathname === "/Home" ? "active" : ""}`}
              style={pathname === "/Home" ? activeItemStyles : {}}
            >
              <Link
                href="/Home"
                style={
                  pathname === "/Home"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-home" style={iconStyles}></i>
                <p>Dashboard</p>
              </Link>
            </li>

            <li
              className={`nav-item ${
                pathname === "/ManageUsers" ? "active" : ""
              }`}
              style={pathname === "/ManageUsers" ? activeItemStyles : {}}
            >
              <Link
                href="/ManageUsers"
                style={
                  pathname === "/ManageUsers"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-users" style={iconStyles}></i>
                <p>User Management</p>
              </Link>
            </li>

            {/* Analytics Dropdown - Fixed */}
            <li
              className={`nav-item ${isAnalyticsActive ? "active" : ""}`}
              style={isAnalyticsActive ? activeItemStyles : {}}
            >
              <div
                className="nav-link"
                onClick={toggleAnalytics}
                style={{
                  ...linkStyles,
                  ...(isAnalyticsActive && activeLinkStyles),
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 15px",
                }}
              >
                <i
                  className="fas fa-chart-bar"
                  style={{ ...iconStyles, margin: "0 14px" }}
                ></i>
                {!sidebarMinimized && (
                  <>
                    <p style={{ flex: 1, margin: "0 8px", fontWeight: "bold" }}>
                      Analytics
                    </p>

                    <i
                      className={`fas ${
                        analyticsOpen ? "fa-chevron-down" : "fa-chevron-right"
                      }`}
                      style={{ fontSize: "0.75rem", ...iconStyles }}
                    ></i>
                  </>
                )}
              </div>

              {!sidebarMinimized && analyticsOpen && (
                <ul className="nav flex-column" style={{ paddingLeft: "20px" }}>
                  <li
                    className={`nav-item ${
                      pathname === "/Analytics" ? "active" : ""
                    }`}
                    style={
                      pathname === "/Analytics"
                        ? { ...activeItemStyles, borderLeft: "none" }
                        : {}
                    }
                  >
                    <Link
                      href="/Analytics"
                      style={{
                        ...linkStyles,
                        ...(pathname === "/Analytics" && activeLinkStyles),
                        padding: "8px 15px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <i
                        className="fas fa-chart-line"
                        style={{ marginRight: "10px", ...iconStyles }}
                      ></i>
                      <p>Reports</p>
                    </Link>
                  </li>
                  <li
                    className={`nav-item ${
                      pathname === "/MapReview" ? "active" : ""
                    }`}
                    style={
                      pathname === "/MapReview"
                        ? { ...activeItemStyles, borderLeft: "none" }
                        : {}
                    }
                  >
                    <Link
                      href="/MapReview"
                      style={{
                        ...linkStyles,
                        ...(pathname === "/MapReview" && activeLinkStyles),
                        padding: "8px 15px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <i
                        className="fas fa-map"
                        style={{ marginRight: "10px", ...iconStyles }}
                      ></i>
                      <p>Heatmap</p>
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* <li
              className={`nav-item ${
                pathname === "/Analytics" ? "active" : ""
              }`}
              style={pathname === "/Analytics" ? activeItemStyles : {}}
            >
              <Link
                href="/Analytics"
                style={
                  pathname === "/Analytics"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-chart-bar" style={iconStyles}></i>
                <p>Reports & Analytics</p>
              </Link>
            </li>
            <li
              className={`nav-item ${
                pathname === "/MapReview" ? "active" : ""
              }`}
              style={pathname === "/MapReview" ? activeItemStyles : {}}
            >
              <Link
                href="/MapReview"
                style={
                  pathname === "/MapReview"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-chart-bar" style={iconStyles}></i>
                <p>HeatMap</p>
              </Link>
            </li>*/}

            <li
              className={`nav-item ${pathname === "/settings" ? "active" : ""}`}
              style={pathname === "/settings" ? activeItemStyles : {}}
            >
              <Link
                href="/settings"
                style={
                  pathname === "/settings"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-cogs" style={iconStyles}></i>
                <p>Settings</p>
              </Link>
            </li>

            <li
              className={`nav-item ${
                pathname === "/BroadCast" ? "active" : ""
              }`}
              style={pathname === "/BroadCast" ? activeItemStyles : {}}
            >
              <Link
                href="/BroadCast"
                style={
                  pathname === "/BroadCast"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-broadcast-tower" style={iconStyles}></i>
                <p>BroadCast</p>
              </Link>
            </li>

            <li
              className={`nav-item ${
                pathname === "/notifications" ? "active" : ""
              }`}
              style={pathname === "/notifications" ? activeItemStyles : {}}
            >
              <Link
                href="/notifications"
                style={
                  pathname === "/notifications"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-bell" style={iconStyles}></i>
                <p>Notifications</p>
              </Link>
            </li>

            <li
              className={`nav-item ${pathname === "/Votes" ? "active" : ""}`}
              style={pathname === "/Votes" ? activeItemStyles : {}}
            >
              <Link
                href="/Votes"
                style={
                  pathname === "/Votes"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-anchor" style={iconStyles}></i>
                <p>Voting Session</p>
              </Link>
            </li>

            <li
              className={`nav-item ${pathname === "/support" ? "active" : ""}`}
              style={pathname === "/support" ? activeItemStyles : {}}
            >
              <Link
                href="/support"
                style={
                  pathname === "/support"
                    ? { ...linkStyles, ...activeLinkStyles }
                    : linkStyles
                }
              >
                <i className="fas fa-life-ring" style={iconStyles}></i>
                <p>Support Desk</p>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

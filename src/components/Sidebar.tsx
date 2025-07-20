"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  const toggleSidebar = () => {
    document.body.classList.toggle("sidebar_minimize");
    setSidebarMinimized(!sidebarMinimized);
  };

  return (
    <div className="sidebar" data-background-color="dark">
      <div className="sidebar-logo">
        <div className="logo-header" data-background-color="dark">
          <Link
            href="/home"
            className="logo"
            style={{ width: "150px", height: "50px" }}
          >
            <img
              src="img/siza.png"
              alt="navbar brand"
              className="navbar-brand"
              height={44}
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
              }}
            >
              <i className="gg-menu-right"></i>
            </button>
          </div>

          <button className="topbar-toggler more">
            <i className="gg-more-vertical-alt"></i>
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
            <li className={`nav-item ${pathname === "/Home" ? "active" : ""}`}>
              <Link href="/Home">
                <i className="fas fa-home"></i>
                <p>Dashboard</p>
              </Link>
            </li>

            <li
              className={`nav-item ${
                pathname === "/ManageUsers" ? "active" : ""
              }`}
            >
              <Link href="/ManageUsers">
                <i className="fas fa-users"></i>
                <p>User Management</p>
              </Link>
            </li>

           {/* <li
              className={`nav-item ${
                pathname === "/Reports_Analytics" ? "active" : ""
              }`}
            >
              <Link href="/Reports_Analytics">
                <i className="fas fa-chart-bar"></i>
                <p>Reports & Analytics</p>
              </Link>
            </li> */}

            <li
              className={`nav-item ${pathname === "/settings" ? "active" : ""}`}
            >
              <Link href="/settings">
                <i className="fas fa-cogs"></i>
                <p>Settings</p>
              </Link>
            </li>

            <li
              className={`nav-item ${
                pathname === "/BroadCast" ? "active" : ""
              }`}
            >
              <Link href="/BroadCast">
                <i className="fas fa-broadcast-tower"></i>
                <p>BroadCast</p>
              </Link>
            </li>

            <li
              className={`nav-item ${
                pathname === "/notifications" ? "active" : ""
              }`}
            >
              <Link href="/notifications">
                <i className="fas fa-bell"></i>
                <p>Notifications</p>
              </Link>
            </li>

            <li
              className={`nav-item ${pathname === "/support" ? "active" : ""}`}
            >
              <Link href="/support">
                <i className="fas fa-life-ring"></i>
                <p>Support Desk</p>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

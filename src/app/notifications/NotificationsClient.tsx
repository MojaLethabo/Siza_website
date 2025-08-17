"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faSort,
  faFilter,
  faCheck,
  faEye,
  faTimes,
  faEnvelope,
  faExclamationCircle,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";

type NotificationType = "info" | "warning" | "alert" | "system";

interface Notification {
  NotificationID: number;
  NotificationType: string;
  EntityType: string;
  EntityID: number;
  Title: string;
  Message: string;
  CreatedAt: string;
  Metadata: string | null;
  IsRead: boolean;
  ReadAt: string | null;
}

const NotificationTypeIcon = ({ type }: { type: NotificationType }) => {
  const iconMap = {
    info: faEnvelope,
    warning: faExclamationCircle,
    alert: faExclamationCircle,
    system: faCog,
  };

  const colorMap = {
    info: "text-primary",
    warning: "text-warning",
    alert: "text-danger",
    system: "text-secondary",
  };

  return (
    <div className={`${colorMap[type]} text-lg`}>
      <FontAwesomeIcon icon={iconMap[type]} />
    </div>
  );
};

export default function NotificationsClient() {
  const [active, setActive] = useState<Notification | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Map API notification types to our UI types
  const mapNotificationType = (apiType: string): NotificationType => {
    switch (apiType) {
      case "BROADCAST":
        return "info";
      case "MESSAGE_FLAGGED":
        return "alert";
      case "SYSTEM_ALERT":
        return "system";
      case "PERMISSION_CHANGE":
        return "warning";
      default:
        return "info";
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/Leader/${user?.UserID}/notifications`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) => (n.NotificationID === id ? { ...n, IsRead: true } : n))
      );

      // Update in backend
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/Leader/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.UserID }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Refresh data to ensure consistency
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
      // Revert UI change on error
      setNotifications((prev) =>
        prev.map((n) => (n.NotificationID === id ? { ...n, IsRead: false } : n))
      );
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Optimistically update UI
      setNotifications((prev) => prev.map((n) => ({ ...n, IsRead: true })));

      // Mark all unread notifications
      const unreadIds = notifications
        .filter((n) => !n.IsRead)
        .map((n) => n.NotificationID);

      for (const id of unreadIds) {
        await fetch(
          `https://myappapi-yo3p.onrender.com/api/Leader/notifications/${id}/read`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user?.UserID }),
          }
        );
      }

      // Refresh data to ensure consistency
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Revert UI changes on error
      fetchNotifications();
    }
  };

  // Fetch notifications on component mount and when user changes
  useEffect(() => {
    if (user?.UserID) {
      fetchNotifications();
    }
  }, [user?.UserID]);

  // Process and sort notifications
  const sorted = useMemo(() => {
    let filtered = [...notifications];

    if (filter !== "all") {
      filtered = filtered.filter(
        (n) => mapNotificationType(n.NotificationType) === filter
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.CreatedAt);
      const dateB = new Date(b.CreatedAt);

      if (sortOrder === "newest") {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });
  }, [notifications, sortOrder, filter]);

  // Count unread notifications
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.IsRead).length;
  }, [notifications]);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button
            className="btn btn-outline-danger btn-sm ms-3"
            onClick={fetchNotifications}
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
        .stat-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }
        
        .avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1rem;
        }
        
        .card {
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
        }
        
        .dropdown-menu {
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          padding: 0.5rem;
        }

        .dropdown-item {
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
          color: #495057;
        }

        .dropdown-toggle::after {
          margin-left: 0.5rem;
        }

        .unread-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #28a745;
          margin-left: 8px;
        }
      `}</style>

      <div className="container-fluid py-4">
        <div className="card">
          <div className="card-header text-white py-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-1">
                  <i className="fas fa-bell me-2"></i>
                  Notifications
                </h3>
                <p className="mb-0 opacity-75">
                  Manage and monitor your notification center
                </p>
              </div>
              
              <div className="d-flex gap-3 align-items-center">
                <div className="stat-badge">
                  <i className="fas fa-envelope me-1"></i>
                  {notifications.length} Total
                </div>
                <div className="stat-badge">
                  <i className="fas fa-eye-slash me-1"></i>
                  {unreadCount} Unread
                </div>
              </div>
            </div>

            <div className="d-flex gap-3 mt-4">
              <div className="dropdown">
                <button
                  className="btn btn-light btn-sm dropdown-toggle"
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <i className="fas fa-sort me-1"></i>
                  Sort: {sortOrder === "newest" ? "Newest" : "Oldest"}
                </button>
                {dropdownOpen && (
                  <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                    <button
                      className={`dropdown-item ${sortOrder === "newest" ? 'active' : ''}`}
                      onClick={() => {
                        setSortOrder("newest");
                        setDropdownOpen(false);
                      }}
                    >
                      Newest first
                    </button>
                    <button
                      className={`dropdown-item ${sortOrder === "oldest" ? 'active' : ''}`}
                      onClick={() => {
                        setSortOrder("oldest");
                        setDropdownOpen(false);
                      }}
                    >
                      Oldest first
                    </button>
                  </div>
                )}
              </div>

              <div className="dropdown">
                <button
                  className="btn btn-light btn-sm dropdown-toggle"
                  type="button"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <i className="fas fa-filter me-1"></i>
                  Filter: {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
                {filterOpen && (
                  <div className={`dropdown-menu ${filterOpen ? 'show' : ''}`}>
                    <button
                      className={`dropdown-item ${filter === "all" ? 'active' : ''}`}
                      onClick={() => {
                        setFilter("all");
                        setFilterOpen(false);
                      }}
                    >
                      All notifications
                    </button>
                    <button
                      className={`dropdown-item ${filter === "info" ? 'active' : ''}`}
                      onClick={() => {
                        setFilter("info");
                        setFilterOpen(false);
                      }}
                    >
                      Information
                    </button>
                    <button
                      className={`dropdown-item ${filter === "warning" ? 'active' : ''}`}
                      onClick={() => {
                        setFilter("warning");
                        setFilterOpen(false);
                      }}
                    >
                      Warnings
                    </button>
                    <button
                      className={`dropdown-item ${filter === "alert" ? 'active' : ''}`}
                      onClick={() => {
                        setFilter("alert");
                        setFilterOpen(false);
                      }}
                    >
                      Alerts
                    </button>
                    <button
                      className={`dropdown-item ${filter === "system" ? 'active' : ''}`}
                      onClick={() => {
                        setFilter("system");
                        setFilterOpen(false);
                      }}
                    >
                      System
                    </button>
                  </div>
                )}
              </div>

              <button
                className="btn btn-light btn-sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <i className="fas fa-check me-1"></i>
                Mark all as read
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {sorted.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-bell fs-1 text-muted opacity-50"></i>
                  <p className="mt-3 text-muted">No notifications found</p>
                  <small className="text-muted">Try changing your filter settings</small>
                </div>
              ) : (
                sorted.map((n) => (
                <div
  key={n.NotificationID}
  className={`list-group-item ${!n.IsRead ? 'bg-light' : ''}`}
>
  <div className="d-flex align-items-start">
    <div className="me-3">
      <NotificationTypeIcon
        type={mapNotificationType(n.NotificationType)}
      />
    </div>
    <div className="flex-grow-1">
      <div className="d-flex justify-content-between align-items-start">
        <h5 className="mb-1">
          {n.Title}
          {!n.IsRead && <span className="unread-dot"></span>}
        </h5>
        <small className="text-muted ms-3" style={{ whiteSpace: 'nowrap' }}>
          {format(new Date(n.CreatedAt), "MMM d, yyyy 'at' h:mm a")}
        </small>
      </div>
      <p className="mb-1 text-muted">{n.Message}</p>
      <div className="d-flex gap-3 mt-2">
        <button
          className="btn btn-link p-0 text-primary"
          onClick={() => setActive(n)}
        >
          <i className="fas fa-eye me-1"></i>
          View details
        </button>
        {!n.IsRead && (
          <button
            className="btn btn-link p-0 text-success"
            onClick={() => markAsRead(n.NotificationID)}
          >
            <i className="fas fa-check me-1"></i>
            Mark as read
          </button>
        )}
      </div>
    </div>
  </div>
</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {active && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setActive(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="d-flex align-items-center">
                  <NotificationTypeIcon
                    type={mapNotificationType(active.NotificationType)}
                  />
                  <h5 className="modal-title ms-2">{active.Title}</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setActive(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>{active.Message}</p>
                <small className="text-muted">
                  {format(new Date(active.CreatedAt), "MMM d, yyyy 'at' h:mm a")}
                </small>
              </div>
              <div className="modal-footer">
                {!active.IsRead && (
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      markAsRead(active.NotificationID);
                      setActive(null);
                    }}
                  >
                    <i className="fas fa-check me-1"></i>
                    Mark as read
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setActive(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
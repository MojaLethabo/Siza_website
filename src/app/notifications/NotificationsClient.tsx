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
    info: "text-blue-500",
    warning: "text-yellow-500",
    alert: "text-red-500",
    system: "text-purple-500",
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
      <div className="page-inner">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            minHeight: "400px",
            background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div className="text-center">
            <div
              className="spinner-border mb-3"
              role="status"
              style={{
                width: "3rem",
                height: "3rem",
                borderColor: "rgba(255,255,255,0.3)",
                borderTopColor: "white",
              }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="fw-light">Loading community members...</h5>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">
            <FontAwesomeIcon icon={faExclamationCircle} />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Error Loading Notifications
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div
            className="px-6 py-6"
            style={{
              background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faBell}
                  className="text-white text-2xl mr-3"
                />
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
              </div>
              <span className="bg-red-500 bg-opacity-20 text-white px-3 py-1 rounded-full text-sm">
                {unreadCount} unread
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="relative">
                <button
                  className="flex items-center bg-purple-500 bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <FontAwesomeIcon icon={faSort} className="mr-2" />
                  Sort: {sortOrder === "newest" ? "Newest" : "Oldest"}
                </button>

                {dropdownOpen && (
                  <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg overflow-hidden">
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        sortOrder === "newest"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setSortOrder("newest");
                        setDropdownOpen(false);
                      }}
                    >
                      Newest first
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        sortOrder === "oldest"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
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

              <div className="relative">
                <button
                  className="flex items-center bg-purple-500 bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <FontAwesomeIcon icon={faFilter} className="mr-2" />
                  Filter:{" "}
                  {filter === "all"
                    ? "All"
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>

                {filterOpen && (
                  <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg overflow-hidden">
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "all"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("all");
                        setFilterOpen(false);
                      }}
                    >
                      All notifications
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "info"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("info");
                        setFilterOpen(false);
                      }}
                    >
                      Information
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "warning"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("warning");
                        setFilterOpen(false);
                      }}
                    >
                      Warnings
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "alert"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setFilter("alert");
                        setFilterOpen(false);
                      }}
                    >
                      Alerts
                    </button>
                    <button
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === "system"
                          ? "bg-indigo-100 text-indigo-700"
                          : "hover:bg-gray-100"
                      }`}
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
                className="flex items-center bg-purple-500 bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Mark all as read
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="divide-y">
            {sorted.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-gray-400 mb-4">
                  <FontAwesomeIcon icon={faBell} size="3x" />
                </div>
                <p className="text-gray-500">No notifications found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try changing your filter settings
                </p>
              </div>
            ) : (
              sorted.map((n) => (
                <div
                  key={n.NotificationID}
                  className={`p-5 hover:bg-gray-50 transition ${
                    !n.IsRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex">
                    <div className="mr-4 mt-1">
                      <NotificationTypeIcon
                        type={mapNotificationType(n.NotificationType)}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-900">
                          {n.Title}
                          {!n.IsRead && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {format(
                            new Date(n.CreatedAt),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </div>
                      </div>

                      <p className="mt-1 text-gray-600 text-sm line-clamp-2">
                        {n.Message}
                      </p>

                      <div className="mt-3 flex space-x-3">
                        <button
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          onClick={() => setActive(n)}
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          View details
                        </button>

                        {!n.IsRead && (
                          <button
                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                            onClick={() => markAsRead(n.NotificationID)}
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
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

      {/* Notification Detail Modal */}
      {active && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className=" px-6 py-4"
              style={{
                background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <NotificationTypeIcon
                    type={mapNotificationType(active.NotificationType)}
                  />
                  <h3 className="ml-3 text-lg font-semibold text-white">
                    {active.Title}
                  </h3>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="text-white hover:text-gray-200"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">{active.Message}</p>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {format(
                    new Date(active.CreatedAt),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </div>

                <div className="flex space-x-3">
                  {!active.IsRead && (
                    <button
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                      onClick={() => {
                        markAsRead(active.NotificationID);
                        setActive(null);
                      }}
                    >
                      <FontAwesomeIcon icon={faCheck} className="mr-1" />
                      Mark as read
                    </button>
                  )}
                  <button
                    className="px-4 py-2 text-white rounded-lg hover:bg-indigo-700 transition"
                    style={{
                      background:
                        "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
                    }}
                    onClick={() => setActive(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
